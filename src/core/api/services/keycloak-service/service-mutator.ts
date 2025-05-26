import { AxiosRequestConfig } from 'axios';
import { keycloakService } from './index';
import { ServiceRequestConfig } from '../base/types';

/**
 * Keycloak Service Mutator for Orval-generated React Query hooks
 * 
 * This function bridges between Orval's generated code and our Keycloak service instance.
 * It receives the request configuration from Orval and uses our KeycloakService to make the actual HTTP call.
 */
export const keycloakServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params } = requestConfig;
  
  // Use the keycloak service's methods based on HTTP method
  switch (method.toUpperCase()) {
    case 'GET':
      return keycloakService.get<T>(url, { params, ...options });
    case 'POST':
      return keycloakService.post<T>(url, data, { params, ...options });
    case 'PUT':
      return keycloakService.put<T>(url, data, { params, ...options });
    case 'PATCH':
      return keycloakService.patch<T>(url, data, { params, ...options });
    case 'DELETE':
      return keycloakService.delete<T>(url, { params, ...options });
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
};
