import { AxiosRequestConfig } from 'axios';
import { keycloakService } from './index';
import { ServiceRequestConfig } from '../base/types';

/**
 * Unified Keycloak Service Mutator for Orval-generated endpoints
 * 
 * This mutator bridges between Orval's generated code and our unified KeycloakService.
 * It automatically handles admin authentication and provides type-safe operations.
 * 
 * Features:
 * - Automatic admin authentication for all operations
 * - Consistent error handling
 * - Type safety with generated schemas
 * - Single point of configuration
 */
export const keycloakServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const { url, method = 'GET', data, params, headers } = requestConfig;
  
  // Merge headers from request config and options
  const mergedOptions: AxiosRequestConfig = {
    params,
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  };
  
  try {
    // Use the unified keycloak service's admin methods for all operations
    switch (method.toUpperCase()) {
      case 'GET':
        return await keycloakService.adminGet<T>(url, mergedOptions);
      
      case 'POST':
        return await keycloakService.adminPost<T>(url, data, mergedOptions);
      
      case 'PUT':
        return await keycloakService.adminPut<T>(url, data, mergedOptions);
      
      case 'PATCH':
        return await keycloakService.adminPatch<T>(url, data, mergedOptions);
      
      case 'DELETE':
        return await keycloakService.adminDelete<T>(url, mergedOptions);
      
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  } catch (error: any) {
    // Enhanced error handling with admin context
    const enhancedError = {
      message: error.message || 'Keycloak admin operation failed',
      status: error.status || 500,
      url,
      method,
      timestamp: new Date().toISOString(),
      isKeycloakError: true,
      originalError: error,
    };

    console.error('Keycloak Admin API Error:', enhancedError);
    throw enhancedError;
  }
};

/**
 * Type-safe wrapper for Keycloak admin operations
 * This can be used for custom operations not covered by generated endpoints
 */
export class KeycloakAdminOperations {
  /**
   * Perform a type-safe admin operation
   */
  static async performOperation<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const contextualError = {
        ...error,
        context: context || 'Keycloak admin operation',
        timestamp: new Date().toISOString(),
      };
      
      console.error(`Keycloak Admin Error [${context}]:`, contextualError);
      throw contextualError;
    }
  }

  /**
   * Verify admin permissions before performing operations
   */
  static async withPermissionCheck<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    
    if (!permissionCheck.authorized) {
      throw new Error(permissionCheck.error || 'Insufficient permissions');
    }

    return this.performOperation(operation, context);
  }
}

// Export the service instance for direct use when needed
export { keycloakService as keycloakAdminService };
