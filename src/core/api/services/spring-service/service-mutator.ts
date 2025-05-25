import { AxiosRequestConfig } from 'axios';
import { springService } from './index';
import { ServiceRequestConfig } from '../base/types';

/**
 * Spring Service Mutator for Orval-generated React Query hooks
 * 
 * This function bridges between Orval's generated code and our Spring service instance.
 * It receives the request configuration from Orval and uses our SpringService to make the actual HTTP call.
 */
export const springServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;
  
  // Use the spring service's methods based on HTTP method
  switch (method.toUpperCase()) {
    case 'GET':
      return springService.get<T>(url, { params, ...options });
    case 'POST':
      return springService.post<T>(url, data, { params, ...options });
    case 'PUT':
      return springService.put<T>(url, data, { params, ...options });
    case 'PATCH':
      return springService.patch<T>(url, data, { params, ...options });
    case 'DELETE':
      return springService.delete<T>(url, { params, ...options });
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
};
