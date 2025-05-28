import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface BaseServiceConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  authType?: 'bearer' | 'api-key' | 'client-credentials' | 'none';
  authTokenKey?: string;
}

export interface RequestData {
  [key: string]: unknown;
}

// Token cache to avoid redundant API calls
class TokenCache {
  private token: string | null = null;
  private expiry: number = 0;
  private refreshPromise: Promise<string | null> | null = null;

  async getToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    const now = Date.now();
    
    // If token is still valid, return it
    if (this.token && now < this.expiry) {
      return this.token;
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start a new refresh
    this.refreshPromise = this.refreshToken(refreshFn);
    const newToken = await this.refreshPromise;
    this.refreshPromise = null;
    
    return newToken;
  }

  private async refreshToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    try {
      const newToken = await refreshFn();
      
      if (newToken) {
        this.token = newToken;
        // Cache for 45 minutes (tokens usually expire in 1 hour)
        this.expiry = Date.now() + (45 * 60 * 1000);
      }
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.token = null;
      this.expiry = 0;
      return null;
    }
  }

  invalidate() {
    this.token = null;
    this.expiry = 0;
    this.refreshPromise = null;
  }
}

// Response interface for token API
interface TokenResponse {
  accessToken: string;
  userId: string;
  userEmail?: string;
  organizations?: Array<{ id: string; name: string }>;
  expiresAt: number;
}

export class BaseService {
  protected instance: AxiosInstance;
  protected config: BaseServiceConfig;
  private tokenCache = new TokenCache();

  constructor(config: BaseServiceConfig) {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
      withCredentials: true, // Important for session cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.instance.interceptors.request.use(
      async (config) => {
        // For database session strategy, get token from our API endpoint
        const token = await this.tokenCache.getToken(() => this.getAuthTokenFromAPI());
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant information if available
        const organizations = await this.getCurrentUserOrganizations();
        if (organizations && organizations.length > 0) {
          // Add the first organization as tenant header for multi-tenant backend
          config.headers['X-Tenant-ID'] = organizations[0].id;
          config.headers['X-Organization-ID'] = organizations[0].id;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If unauthorized, invalidate token cache and try once more
        if (error.response?.status === 401) {
          this.tokenCache.invalidate();
          
          // Try to get a fresh token
          const freshToken = await this.getAuthTokenFromAPI();
          if (freshToken && error.config && !error.config._retried) {
            error.config._retried = true;
            error.config.headers.Authorization = `Bearer ${freshToken}`;
            return this.instance.request(error.config);
          }
          
          // If still unauthorized, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }
        return this.handleError(error);
      }
    );
  }

  /**
   * Get access token from our API endpoint (database session strategy)
   */
  protected async getAuthTokenFromAPI(): Promise<string | null> {
    try {
      // Only available on client-side
      if (typeof window === 'undefined') {
        return null;
      }

      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated, redirecting to login');
          return null;
        }
        throw new Error(`Token API responded with status: ${response.status}`);
      }

      const data: TokenResponse = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error('Error getting access token from API:', error);
      return null;
    }
  }

  /**
   * Get current user organizations for tenant context
   */
  protected async getCurrentUserOrganizations(): Promise<Array<{ id: string; name: string }> | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      return session?.user?.organizations || null;
    } catch (error) {
      console.error('Error getting user organizations:', error);
      return null;
    }
  }

  protected async getAuthTokenFromSession(): Promise<string | null> {
    // This method is kept for compatibility but now uses the API endpoint
    return await this.getAuthTokenFromAPI();
  }

  protected async getClientCredentialsToken(): Promise<string | null> {
    // Implement client credentials flow if needed
    return null;
  }

  protected handleError(error: any) {
    const enhancedError = {
      message: error.response?.data?.message || error.message || 'API request failed',
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
    };

    console.error('API Error:', enhancedError);
    return Promise.reject(enhancedError);
  }

  // Method to manually invalidate token cache (useful for logout)
  public invalidateTokenCache() {
    this.tokenCache.invalidate();
  }

  // Generic HTTP methods with improved error handling
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  async post<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  async put<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  async patch<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  private enhanceError(error: any) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP status codes
      switch (error.response?.status) {
        case 401:
          return new Error('Authentication required - please sign in again');
        case 403:
          return new Error('Access forbidden - insufficient permissions');
        case 404:
          return new Error('Resource not found');
        case 429:
          return new Error('Too many requests - please try again later');
        case 500:
          return new Error('Server error - please try again later');
        default:
          return error;
      }
    }
    return error;
  }
}

/**
 * Utility function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const session = await response.json();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

/**
 * Utility function to get current user session
 */
export async function getCurrentSession() {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}
