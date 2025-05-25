import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

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
        const token = await this.getAuthToken();
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
      (error) => this.handleError(error)
    );
  }

  protected async getAuthToken(): Promise<string | null> {
    try {
      switch (this.config.authType) {
        case 'bearer':
          const session = await getSession();
          return session?.id_token || session?.accessToken || null;
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

  // Generic HTTP methods
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
