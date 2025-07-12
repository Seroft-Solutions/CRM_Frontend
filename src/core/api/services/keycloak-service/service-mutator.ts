import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from "@/core/api/services/base/types";
import { KEYCLOAK_SERVICE_CONFIG, KEYCLOAK_ADMIN_CONFIG } from "@/core/api/services/keycloak-service/config";

// Admin token cache
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

  // Add auth interceptor
  instance.interceptors.request.use(async (config) => {
    const token = await getAdminToken(instance.defaults.baseURL as string);
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
    headers, // Preserve headers from generated endpoints
    ...options,
  });

  return response.data;
};
