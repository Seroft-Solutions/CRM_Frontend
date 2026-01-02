import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { sessionEventEmitter, TokenCache } from '@/core/auth';

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

  public invalidateTokenCache() {
    this.tokenCache.invalidate();
  }

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

  protected async getAuthTokenFromSession(): Promise<string | null> {
    try {
      switch (this.config.authType) {
        case 'bearer':
          const { fetchAccessToken } = await import('@/core/auth');
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

  private setupInterceptors() {
    if (typeof window !== 'undefined') {
      window.addEventListener('token-refreshed', ((event: CustomEvent) => {
        this.tokenCache.invalidate();
      }) as EventListener);
    }

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

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.tokenCache.invalidate();

          if (typeof window !== 'undefined' && !error.config?._retry) {
            // Don't try to refresh - just emit event and let SessionManager handle it
            sessionEventEmitter.emit('session-expired', {
              message: 'Your session has expired',
              statusCode: 401,
            });
          }
        }

        return this.handleError(error);
      }
    );
  }
}
