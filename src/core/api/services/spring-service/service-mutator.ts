import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from '../base/types';
import { SPRING_SERVICE_CONFIG, SPRING_SERVICE_LONG_RUNNING_CONFIG } from './config';
import { TokenCache } from '@/core/auth';
import { fetchAccessToken } from '@/core/auth';
import { getTenantHeader } from '../shared/tenant-helper';
import { sessionEventEmitter } from '@/core/auth';

const tokenCache = new TokenCache();

if (typeof window !== 'undefined') {
  window.addEventListener('token-refreshed', ((event: CustomEvent) => {
    tokenCache.invalidate();
  }) as EventListener);
}


// Check if the request is a long-running operation
const isLongRunningOperation = (url: string): boolean => {
  return (
    url.includes('/tenants/organizations/setup') ||
    url.includes('/setup-progress') ||
    (url.includes('/schemas/') && url.includes('/setup'))
  );
};

export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;

  const config =
    url && isLongRunningOperation(url) ? SPRING_SERVICE_LONG_RUNNING_CONFIG : SPRING_SERVICE_CONFIG;

  const instance = axios.create(config);

  // Add custom parameter serialization for Spring Boot compatibility
  instance.defaults.paramsSerializer = (params) => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (Array.isArray(value)) {
        // For arrays, add each value as a separate parameter (Spring Boot format)
        value.forEach(item => {
          searchParams.append(key, item);
        });
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    return searchParams.toString();
  };

  // Add auth and tenant interceptor
  instance.interceptors.request.use(async (config) => {
    const token = await tokenCache.getToken(fetchAccessToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant header if available
    const tenantHeader = getTenantHeader();
    if (tenantHeader) {
      config.headers['X-Tenant-Name'] = tenantHeader;
    }

    return config;
  });

  // Add response interceptor for 401 error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        tokenCache.invalidate();

        if (typeof window !== 'undefined' && !error.config?._retry) {
          try {
            const { refreshSession } = await import('@/core/auth');
            const refreshed = await refreshSession();
            if (refreshed) {
              error.config._retry = true;
              const token = await tokenCache.getToken(fetchAccessToken);
              if (token) {
                error.config.headers = error.config.headers || {};
                error.config.headers.Authorization = `Bearer ${token}`;
              }
              return instance.request(error.config);
            }
          } catch (refreshError) {
            console.error('Auto refresh failed:', refreshError);
          }

          // Emit session expired event to trigger modal
          sessionEventEmitter.emit('session-expired', {
            message: 'Your session has expired',
            statusCode: 401,
          });
        }
      }

      return Promise.reject(error);
    }
  );

  const response = await instance.request({
    url,
    method: method as any,
    data,
    params,
    ...options,
  });

  return response.data;
};
