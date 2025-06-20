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

// Function to get tenant header from localStorage
const getTenantHeader = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const selectedOrgName = localStorage.getItem('selectedOrganizationName');
  if (!selectedOrgName) return undefined;
  
  // Convert to lowercase and replace special characters with underscores
  return selectedOrgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;
  
  // Log API calls to debug data transformation
  if (method === 'POST' && url?.includes('sub-call-types')) {
    console.log('🚀 API MUTATOR - About to send POST request:');
    console.log('🚀 URL:', url);
    console.log('🚀 Method:', method);
    console.log('🚀 Data received by mutator:', data);
    console.log('🚀 Data type:', typeof data);
    console.log('🚀 Data constructor:', data?.constructor?.name);
    console.log('🚀 Stringified Data:', JSON.stringify(data, null, 2));
    
    if (data && typeof data === 'object') {
      console.log('🚀 Data keys:', Object.keys(data));
      if (data.callType) {
        console.log('🚀 callType value:', data.callType);
        console.log('🚀 callType type:', typeof data.callType);
        console.log('🚀 callType stringified:', JSON.stringify(data.callType, null, 2));
      }
    }
  }
  
  const instance = axios.create(SPRING_SERVICE_CONFIG);
  
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

  const response = await instance.request({
    url,
    method: method as any,
    data,
    params,
    ...options,
  });

  return response.data;
};
