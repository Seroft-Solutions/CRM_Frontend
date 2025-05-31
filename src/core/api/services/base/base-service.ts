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

// Token cache to avoid redundant session calls
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
        // Cache for 5 minutes (considering most JWTs expire in 15-30 minutes)
        this.expiry = Date.now() + (5 * 60 * 1000);
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
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await this.tokenCache.getToken(() => this.getAuthTokenFromSession());
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // If unauthorized, invalidate token cache
        if (error.response?.status === 401) {
          this.tokenCache.invalidate();
        }
        return this.handleError(error);
      }
    );
  }

  protected async getAuthTokenFromSession(): Promise<string | null> {
    try {
      switch (this.config.authType) {
        case 'bearer':
          // For client-side, tokens are no longer stored in session for security
          // Instead, we'll use session cookies for authentication
          if (typeof window !== 'undefined') {
            // Client-side: Check if user is authenticated via session
            const response = await fetch('/api/auth/session');
            if (response.ok) {
              const session = await response.json();
              // Since tokens are not in session anymore, we'll rely on cookie-based auth
              // or create a separate token endpoint if needed
              if (session?.user) {
                // User is authenticated, but we don't have client-side tokens
                // This is by design for security. API calls should use session cookies
                return 'session-authenticated'; // Placeholder to indicate auth status
              }
            }
          } else {
            // Server-side - can access tokens from JWT
            const { auth } = await import('@/auth');
            const session = await auth();
            
            // On server-side, we can access the full JWT token
            if (session?.user) {
              // Return a server-side token or handle authentication server-side
              return 'server-authenticated'; // Placeholder
            }
          }
          return null;
        case 'api-key':
          // Handle API key authentication
          return process.env[this.config.authTokenKey || ''] || null;
        case 'client-credentials':
          // Handle client credentials flow
          return await this.getClientCredentialsToken();
        case 'none':
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
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
      // Handle authentication errors gracefully
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Redirect to home page or handle auth error
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  async patch<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('Authentication required');
      }
      throw error;
    }
  }
}
