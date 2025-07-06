import axios, { AxiosRequestConfig } from 'axios';
import { ServiceRequestConfig } from '../base/types';
import { SPRING_SERVICE_CONFIG, SPRING_SERVICE_LONG_RUNNING_CONFIG } from './config';
import { TokenCache } from '@/core/auth';
import { fetchAccessToken } from '@/core/auth';

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

  // Fix sort parameter serialization for Spring Boot
  let processedParams = params;
  if (params && params.sort && Array.isArray(params.sort)) {
    processedParams = {
      ...params,
      // Convert array to multiple sort parameters for Spring Boot
      sort: params.sort
    };
    
    // Log the sort parameter processing for debugging
    if (url?.includes('/calls')) {
      console.log('🔍 Sort parameter processing:');
      console.log('Original sort:', params.sort);
      console.log('Processed params:', processedParams);
    }
  }

  // Use long-running config for organization setup operations
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

  const response = await instance.request({
    url,
    method: method as any,
    data,
    params: processedParams,
    ...options,
  });

  return response.data;
};
