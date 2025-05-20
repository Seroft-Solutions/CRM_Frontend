import { AxiosError, AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axios-client';
import { API_URL } from '../config/constants';
import { getSession } from 'next-auth/react';

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
  try {
    // Get auth session
    const session = await getSession();
    console.log("Usman "+session.accessToken);
    // Add authorization header if we have an access token
    if (session?.accessToken) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${session.accessToken}`,
      };
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }
  
  try {
    // Make API request
    const response = await axiosInstance({
      url: requestConfig.url,
      method: requestConfig.method ?? 'GET',
      data: requestConfig.data,
      params: requestConfig.params,
      headers: requestConfig.headers,
      signal: requestConfig.signal,
      ...options,
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