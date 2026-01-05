import axios, { AxiosRequestConfig } from 'axios';
import {
  SPRING_SERVICE_CONFIG,
  SPRING_SERVICE_LONG_RUNNING_CONFIG,
} from '@/core/api/services/spring-service/config';
import { getTenantHeader } from '@/core/api/services/shared/tenant-helper';
import { sessionEventEmitter } from '@/core/auth/session/events';

class SimpleTokenCache {
  private token: string | null = null;
  private expiry = 0;
  private refreshPromise: Promise<string | null> | null = null;

  async getToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    const now = Date.now();
    if (this.token && now < this.expiry) {
      return this.token;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.refreshToken(refreshFn);
    const newToken = await this.refreshPromise;
    this.refreshPromise = null;
    return newToken;
  }

  invalidate() {
    this.token = null;
    this.expiry = 0;
    this.refreshPromise = null;
  }

  private async refreshToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    try {
      const newToken = await refreshFn();
      if (newToken) {
        this.token = newToken;
        this.expiry = Date.now() + 5 * 60 * 1000;
      }
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.token = null;
      this.expiry = 0;
      return null;
    }
  }
}

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

const tokenCache = new SimpleTokenCache();

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
          try {
            const response = await fetch('/api/auth/session', {
              method: 'GET',
              credentials: 'include',
            });

            if (response.ok) {
              const session = await response.json();
              if (session?.access_token && !session.error) {
                tokenCache.invalidate();

                error.config._retry = true;
                error.config.headers = error.config.headers || {};
                error.config.headers.Authorization = `Bearer ${session.access_token}`;
                return instance.request(error.config);
              } else if (session?.error) {
                console.error('Session has error:', session.error);
              }
            }
          } catch (refreshError) {
            console.error('Auto refresh failed:', refreshError);
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
