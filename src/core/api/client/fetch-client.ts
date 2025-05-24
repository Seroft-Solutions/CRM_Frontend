import { AxiosError, AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axios-client';
// API_URL is not used, can be removed if not needed elsewhere, but keeping for now.
// import { API_URL } from '../config/constants'; 
// Removed getSession import

interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: RequestData;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

interface RequestData {
  [key: string]: unknown;
}

/**
 * Custom fetch client for Orval-generated API clients
 */
export const customFetch = async <T>(
  requestConfig: RequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  // Headers from requestConfig.headers will be used by default if present.
  // If options.headers is also present, axiosInstance will merge them,
  // with options.headers taking precedence for any overlapping header keys.
  
  try {
    // Make API request
    const response = await axiosInstance({
      url: requestConfig.url,
      method: requestConfig.method ?? 'GET',
      data: requestConfig.data,
      params: requestConfig.params,
      headers: requestConfig.headers, // Pass through headers from requestConfig
      signal: requestConfig.signal,
      ...options, // Spread options, which might include headers that override requestConfig.headers
    });

    return response.data as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Create enhanced error
      const enhancedError = new Error(
        error.response?.data?.message || error.message || 'API request failed'
      );

      // Add extra context to error
      Object.assign(enhancedError, {
        data: error.response?.data,
        status: error.response?.status,
        url: requestConfig.url,
        method: requestConfig.method,
      });

      throw enhancedError;
    }
    
    throw error;
  }
};

export default customFetch;