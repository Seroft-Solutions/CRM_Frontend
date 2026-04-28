import axios, { AxiosRequestConfig } from 'axios';
import {
  SPRING_SERVICE_CONFIG,
  SPRING_SERVICE_LONG_RUNNING_CONFIG,
} from '@/core/api/services/spring-service/config';
import { getTenantHeader } from '@/core/api/services/shared/tenant-helper';
import { TokenCache } from '@/core/auth/tokens/cache';
import { sessionEventEmitter } from '@/core/auth/session/events';

async function fetchAccessTokenStandalone(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        return session?.access_token || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

const tokenCache = new TokenCache();

if (typeof window !== 'undefined') {
  window.addEventListener('token-refreshed', (() => {
    tokenCache.invalidate();
  }) as EventListener);
}

const isLongRunningOperation = (url: string): boolean => {
  return (
    url.includes('/tenants/organizations/setup') ||
    url.includes('/setup-progress') ||
    (url.includes('/schemas/') && url.includes('/setup'))
  );
};

export const springServiceMutator = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = config;

  const axiosConfig =
    url && isLongRunningOperation(url) ? SPRING_SERVICE_LONG_RUNNING_CONFIG : SPRING_SERVICE_CONFIG;

  const instance = axios.create(axiosConfig);

  instance.defaults.paramsSerializer = (params) => {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, item);
        });
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    return searchParams.toString();
  };

  instance.interceptors.request.use(async (requestConfig) => {
    const token = await tokenCache.getToken(fetchAccessTokenStandalone);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    const tenantHeader = getTenantHeader();
    if (tenantHeader) {
      requestConfig.headers['X-Tenant-Name'] = tenantHeader;
    }

    return requestConfig;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        tokenCache.invalidate();

        if (typeof window !== 'undefined' && !error.config?._retry) {
          const token = await tokenCache.getToken(fetchAccessTokenStandalone);

          if (token) {
            error.config._retry = true;
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${token}`;
            return instance.request(error.config);
          }

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

export type ErrorType<E> = E;
