import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from '../base/types';
import { SPRING_SERVICE_CONFIG } from './config';

export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;
  
  const instance = axios.create(SPRING_SERVICE_CONFIG);
  
  // Add auth interceptor
  instance.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        }
      } catch (error) {
        console.warn('Auth token fetch failed:', error);
      }
    }
    return config;
  });

  const response = await instance.request({
    url,
    method: method as any,
    data,
    params,
    ...options,
  });

  return response.data;
};
