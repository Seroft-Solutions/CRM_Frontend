import { AxiosRequestConfig } from 'axios';
import { BaseService } from '@/core/api/services/base/base-service';
import { ServiceRequestConfig } from '@/core/api/services/base/types';

/**
 * Creates a service mutator function for Orval
 * This factory pattern avoids circular dependencies while maintaining clean architecture
 */
export function createServiceMutator(serviceInstance: BaseService) {
  return async <T>(
    requestConfig: ServiceRequestConfig,
    options?: AxiosRequestConfig
  ): Promise<T> => {
    const { url, method = 'GET', data, params } = requestConfig;

    const config = { params, ...options };

    switch (method.toUpperCase()) {
      case 'GET':
        return serviceInstance.get<T>(url, config);
      case 'POST':
        return serviceInstance.post<T>(url, data, config);
      case 'PUT':
        return serviceInstance.put<T>(url, data, config);
      case 'PATCH':
        return serviceInstance.patch<T>(url, data, config);
      case 'DELETE':
        return serviceInstance.delete<T>(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  };
}
