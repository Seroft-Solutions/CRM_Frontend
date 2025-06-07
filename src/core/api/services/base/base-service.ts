import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sessionEventEmitter } from '@/lib/session-events';
import { TokenCache } from '@/lib/token-cache';

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
    // Listen for token refresh events
    if (typeof window !== 'undefined') {
      window.addEventListener('token-refreshed', ((event: CustomEvent) => {
        console.log('Token refreshed, clearing cache')
        this.tokenCache.invalidate()
      }) as EventListener)
    }

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
        // If unauthorized, invalidate token cache and emit session event
        if (error.response?.status === 401) {
          this.tokenCache.invalidate();
          
          // Emit session expired event instead of immediate redirect
          if (typeof window !== 'undefined') {
            sessionEventEmitter.emit('session-expired', {
              message: 'Your session has expired',
              statusCode: 401
            });
          }
        }
        return this.handleError(error);
      }
    );
  }

  protected async getAuthTokenFromSession(): Promise<string | null> {
    try {
      switch (this.config.authType) {
        case 'bearer':
          const { fetchAccessToken } = await import('@/lib/auth-token');
          return await fetchAccessToken();
        case 'api-key':
          return process.env[this.config.authTokenKey || ''] || null;
        case 'client-credentials':
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
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}
