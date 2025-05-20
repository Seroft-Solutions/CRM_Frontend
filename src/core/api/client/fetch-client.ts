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
 * This function wraps the axios instance and is compatible with Orval's expected format
 */
export const customFetch = async <T>(
  requestConfig: RequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  // Get session token
  try {
    const session = await getSession();
    if (session?.id_token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${session.id_token}`,
      };
    }
  } catch (error) {
    console.error('Error getting session token:', error);
  }
  try {
    // Log request details in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`API Request: ${requestConfig.method || 'GET'} ${requestConfig.url}`, {
        params: requestConfig.params,
        headers: requestConfig.headers,
        baseURL: API_URL,
      });
    }

    const response = await axiosInstance({
      url: requestConfig.url,
      method: requestConfig.method ?? 'GET',
      data: requestConfig.data,
      params: requestConfig.params,
      headers: requestConfig.headers,
      signal: requestConfig.signal,
      ...options,
    });

    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`API Response: ${requestConfig.method || 'GET'} ${requestConfig.url}`, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response.data as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Log detailed error information
      console.error(`API Error: ${requestConfig.method || 'GET'} ${requestConfig.url}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Enhance error with more details from the response
      const enhancedError = new Error(
        error.response?.data?.message || error.message || 'An error occurred during the API request'
      );

      // Define enhanced error interface
      interface EnhancedError extends Error {
        data?: unknown;
        status?: number;
        url?: string;
        method?: string;
      }

      // Add response data to the error for more context
      (enhancedError as EnhancedError).data = error.response?.data;
      (enhancedError as EnhancedError).status = error.response?.status;
      (enhancedError as EnhancedError).url = requestConfig.url;
      (enhancedError as EnhancedError).method = requestConfig.method;

      throw enhancedError;
    }
    
    // For non-Axios errors
    console.error(`Unexpected API error: ${requestConfig.method || 'GET'} ${requestConfig.url}`, error);
    throw error;
  }
};

export default customFetch;
