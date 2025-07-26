import axios, { AxiosRequestConfig } from 'axios';

// Types
interface ServiceRequestConfig {
  url: string;
  method?: string;
  data?: any;
  params?: any;
}

// Simple token cache
class SimpleTokenCache {
  private token: string | null = null;
  private expiry: number = 0;

  getToken(fetcher: () => Promise<string | null>): Promise<string | null> {
    if (this.token && Date.now() < this.expiry) {
      return Promise.resolve(this.token);
    }
    return fetcher().then(token => {
      this.token = token;
      this.expiry = Date.now() + 55 * 60 * 1000; // 55 minutes
      return token;
    });
  }

  invalidate() {
    this.token = null;
    this.expiry = 0;
  }
}

const tokenCache = new SimpleTokenCache();

// Simple token fetcher - this will need to be adapted
const fetchAccessToken = async (): Promise<string | null> => {
  try {
    if (typeof window !== 'undefined') {
      // Try to get token from session storage or make auth call
      const token = sessionStorage.getItem('access_token');
      return token;
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
  }
  return null;
};

// Get tenant header
const getTenantHeader = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const selectedOrgName = localStorage.getItem('selectedOrganizationName');
  if (!selectedOrgName) return undefined;
  return selectedOrgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Check if long-running operation
const isLongRunningOperation = (url: string): boolean => {
  return (
    url.includes('/tenants/organizations/setup') ||
    url.includes('/setup-progress') ||
    (url.includes('/schemas/') && url.includes('/setup'))
  );
};

// Service configs
const SPRING_SERVICE_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'https://api.dev.crmcup.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Service': 'crm-frontend',
  },
};

const SPRING_SERVICE_LONG_RUNNING_CONFIG = {
  ...SPRING_SERVICE_CONFIG,
  timeout: 120000,
};

export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;

  // Fix sort parameter serialization for Spring Boot
  let processedParams = params;
  if (params && params.sort && Array.isArray(params.sort)) {
    processedParams = {
      ...params,
      sort: params.sort, // Keep array format for proper serialization
    };
  }

  // Use long-running config for organization setup operations
  const config = url && isLongRunningOperation(url) 
    ? SPRING_SERVICE_LONG_RUNNING_CONFIG 
    : SPRING_SERVICE_CONFIG;

  const instance = axios.create(config);

  // Add custom parameter serialization for Spring Boot compatibility
  instance.defaults.paramsSerializer = (params) => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (Array.isArray(value)) {
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
        
        if (typeof window !== 'undefined') {
          // Emit session expired event
          window.dispatchEvent(new CustomEvent('session-expired', {
            detail: {
              message: 'Your session has expired',
              statusCode: 401,
            }
          }));
        }
      }

      return Promise.reject(error);
    }
  );

  const response = await instance.request({
    url,
    method: method as any,
    data,
    params: processedParams,
    ...options,
  });

  return response.data;
};