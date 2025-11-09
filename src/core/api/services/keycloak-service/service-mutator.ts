import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from '@/core/api/services/base/types';
import {
  KEYCLOAK_ADMIN_CONFIG,
  KEYCLOAK_SERVICE_CONFIG,
} from '@/core/api/services/keycloak-service/config';
import { sessionEventEmitter } from '@/core/auth';

let adminToken: string | null = null;
let tokenExpiry = 0;

const getAdminToken = async (baseURL: string): Promise<string | null> => {
  if (adminToken && Date.now() < tokenExpiry - 30000) {
    return adminToken;
  }

  try {
    const tokenUrl = `${baseURL}/realms/master/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: KEYCLOAK_ADMIN_CONFIG.username,
      password: KEYCLOAK_ADMIN_CONFIG.password,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (response.ok) {
      const data = await response.json();
      adminToken = data.access_token;
      tokenExpiry = Date.now() + data.expires_in * 1000;
      return adminToken;
    }
  } catch (error) {
    console.warn('Admin token fetch failed:', error);
  }
  return null;
};

export const keycloakServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params, headers } = requestConfig;

  const instance = axios.create(KEYCLOAK_SERVICE_CONFIG);

  instance.interceptors.request.use(async (config) => {
    const token = await getAdminToken(instance.defaults.baseURL as string);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        adminToken = null;
        tokenExpiry = 0;

        if (typeof window !== 'undefined' && !error.config?._retry) {
          try {
            const token = await getAdminToken(instance.defaults.baseURL as string);
            if (token) {
              error.config._retry = true;
              error.config.headers = error.config.headers || {};
              error.config.headers.Authorization = `Bearer ${token}`;
              return instance.request(error.config);
            }
          } catch (refreshError) {
            console.error('Keycloak admin token refresh failed:', refreshError);
          }

          sessionEventEmitter.emit('session-expired', {
            message: 'Your admin session has expired',
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
    headers,
    ...options,
  });

  return response.data;
};
