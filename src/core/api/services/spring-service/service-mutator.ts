import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from '../base/types';
import { SPRING_SERVICE_CONFIG } from './config';
import { TokenCache } from '@/lib/token-cache';
import { fetchAccessToken } from '@/lib/auth-token';

const tokenCache = new TokenCache();

if (typeof window !== 'undefined') {
  window.addEventListener('token-refreshed', ((event: CustomEvent) => {
    tokenCache.invalidate();
  }) as EventListener);
}

export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;
  
  const instance = axios.create(SPRING_SERVICE_CONFIG);
  
  // Add auth interceptor with token caching
  instance.interceptors.request.use(async (config) => {
    const token = await tokenCache.getToken(fetchAccessToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
