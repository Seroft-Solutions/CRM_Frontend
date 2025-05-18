import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/features/core/tanstack-query-api/core/apiClient';
import { 
  DependencyParamConfig, 
  FetchOptionsConfig, 
  OptionItem, 
  UseDependentFieldsResult 
} from './types';

/**
 * Hook for fetching dependent field options across the application
 * 
 * This hook provides a standardized way to handle dependent select fields
 * like Call Type → Sub Call Type, Country → State → City, etc.
 * 
 * Features:
 * - Efficient caching with React Query
 * - Support for path parameters and query parameters
 * - Flexible dependency configuration
 * - Prefetching support
 * - Proper error handling
 * 
 * @returns Functions for handling dependent field operations
 */
export function useDependentFields(): UseDependentFieldsResult {
  const queryClient = useQueryClient();
  
  /**
   * Process dependencies based on various input formats
   * 
   * @param dependencyConfig The dependency configuration
   * @param dependencyValues The current values of all fields
   * @returns Processed dependency object ready for API request
   */
  const processDependencies = useCallback(
    (dependencyConfig: FetchOptionsConfig['dependencies'], dependencyValues: Record<string, any>) => {
      // Initialize an empty dependency object
      const result: Record<string, any> = {};
      
      if (!dependencyConfig) {
        return result;
      }
      
      // Handle string (single dependency)
      if (typeof dependencyConfig === 'string') {
        const fieldName = dependencyConfig;
        result[fieldName] = dependencyValues[fieldName];
        return result;
      }
      
      // Handle string array (multiple dependencies with same param names)
      if (Array.isArray(dependencyConfig) && dependencyConfig.length > 0 && typeof dependencyConfig[0] === 'string') {
        for (const fieldName of dependencyConfig as string[]) {
          result[fieldName] = dependencyValues[fieldName];
        }
        return result;
      }
      
      // Handle record object (mapping from param names to field names)
      if (!Array.isArray(dependencyConfig) && typeof dependencyConfig === 'object') {
        for (const [paramName, fieldName] of Object.entries(dependencyConfig)) {
          result[paramName] = dependencyValues[fieldName as string];
        }
        return result;
      }
      
      // Handle array of DependencyParamConfig (most flexible)
      if (Array.isArray(dependencyConfig) && dependencyConfig.length > 0 && typeof dependencyConfig[0] === 'object') {
        for (const config of dependencyConfig as DependencyParamConfig[]) {
          const { parentField, paramName = parentField, transform } = config;
          const value = dependencyValues[parentField];
          
          if (transform) {
            result[paramName] = transform(value);
          } else {
            result[paramName] = value;
          }
        }
        return result;
      }
      
      return result;
    },
    []
  );
  
  /**
   * Fetch options for a dependent select field
   * 
   * @param config Configuration for the fetch operation
   * @param dependencyValues Values of the dependency fields
   * @returns An array of options in { label, value } format
   */
  const fetchOptions = useCallback(
    async (config: FetchOptionsConfig, dependencyValues: Record<string, any>): Promise<OptionItem[]> => {
      const {
        endpoint,
        labelKey = 'name',
        valueKey = 'id',
        dependencies,
        usePathParams = false,
        staticParams = {},
        transformDependencies,
      } = config;
      
      try {
        // Process dependencies based on configuration
        const processedDeps = processDependencies(dependencies, dependencyValues);
        
        // Apply custom transformation if provided
        const finalDependencies = transformDependencies ? transformDependencies(processedDeps) : processedDeps;
        
        // Filter out empty dependency values
        const validDependencies = Object.entries(finalDependencies)
          .filter(([_, value]) => value !== undefined && value !== null && value !== '')
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, any>);
        
        // Add static parameters
        Object.entries(staticParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            validDependencies[key] = value;
          }
        });
        
        // Check if we have any dependencies to process
        const hasDependencies = Object.keys(validDependencies).length > 0;
        
        // Don't fetch if required dependencies are missing
        if (!hasDependencies) {
          return [];
        }
        
        let url = endpoint;
        
        // Apply path parameters if configured
        if (usePathParams) {
          // Replace path parameters in URL template
          // Example: /api/masters/{stateId}/cities
          for (const [key, value] of Object.entries(validDependencies)) {
            const placeholder = `{${key}}`;
            if (url.includes(placeholder)) {
              url = url.replace(placeholder, encodeURIComponent(String(value)));
              // Remove used parameters so they're not added as query params
              delete validDependencies[key];
            }
          }
        }
        
        // Construct query parameters from remaining dependencies
        const queryParams = new URLSearchParams();
        Object.entries(validDependencies).forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
        
        const queryString = queryParams.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        
        // Make the API request using the same apiClient
        const response = await apiClient.get(finalUrl);
        
        if (!response || !response.data) {
          console.error(`Failed to fetch options from ${finalUrl}: Empty response`);
          return [];
        }
        
        // Get the data from the response
        const data = response.data;
        
        // Handle different response formats
        let items: any[] = [];
        
        // If contentPath is specified, use it to extract data
        if (config.contentPath && typeof config.contentPath === 'string') {
          try {
            // Handle nested paths like 'data.items'
            const paths = config.contentPath.split('.');
            let result = data;
            
            for (const path of paths) {
              if (result && result[path]) {
                result = result[path];
              } else {
                result = null;
                break;
              }
            }
            
            if (Array.isArray(result)) {
              items = result;
            }
          } catch (error) {
            console.error(`Error accessing contentPath:`, error);
          }
        }
        // Otherwise try common patterns
        else if (Array.isArray(data)) {
          items = data;
        } else if (data?.content && Array.isArray(data.content)) {
          items = data.content;
        } else if (data?.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data?.items && Array.isArray(data.items)) {
          items = data.items;
        } else if (data?.results && Array.isArray(data.results)) {
          items = data.results;
        } else if (data?.page?.content && Array.isArray(data.page.content)) {
          items = data.page.content;
        }
        
        // Map items to the required format
        return items.map(item => ({
          label: item[labelKey] || item.name || item.label || String(item[valueKey] || item.id),
          value: String(item[valueKey] || item.id || item.value),
          data: item // Store the original item data for reference
        }));
      } catch (error) {
        console.error(`Error fetching options from ${endpoint}:`, error);
        return [];
      }
    },
    [processDependencies]
  );
  
  /**
   * Create a fetch function for a specific endpoint configuration
   * 
   * @param config The endpoint configuration or a simple endpoint string
   * @returns A function that takes dependencies and returns options
   */
  const createFetchFunction = useCallback(
    (config: string | FetchOptionsConfig) => {
      // Handle string shorthand (just the endpoint)
      const fullConfig = typeof config === 'string' ? { endpoint: config } : config;
      
      return async (dependencies: Record<string, any>): Promise<OptionItem[]> => {
        return await fetchOptions(fullConfig, dependencies);
      };
    },
    [fetchOptions]
  );
  
  /**
   * Prefetch options for a dependent field
   * 
   * @param config The endpoint configuration
   * @param dependencies The dependency values
   * @param queryKey The query key to use for caching
   */
  const prefetchOptions = useCallback(
    (config: FetchOptionsConfig, dependencies: Record<string, any>, queryKey: unknown[]) => {
      const { staleTime = 5 * 60 * 1000 } = config; // Default 5 minutes
      
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () => fetchOptions(config, dependencies),
        staleTime,
      });
    },
    [queryClient, fetchOptions]
  );
  
  return {
    fetchOptions,
    createFetchFunction,
    prefetchOptions,
    processDependencies,
  };
}

/**
 * Helper functions for common dependent dropdown relationships
 * These functions create standard fetch functions for common entity relationships
 */
export const createCommonDependentFetchFunctions = () => {
  const { createFetchFunction } = useDependentFields();
  
  return {
    /**
     * Get the fetch function for sub call types based on call type
     * 
     * @returns A function that fetches sub call types based on call type ID
     */
    subCallTypes: () => 
      createFetchFunction({
        endpoint: '/api/masters/call-type/{callTypeId}/sub-types',
        labelKey: 'name',
        valueKey: 'id',
        usePathParams: true, // Use path parameters instead of query string
        dependencies: {
          callTypeId: 'callTypeId',
        },
        contentPath: 'content', // For paginated responses
        queryKeyPrefix: 'subCallTypes',
      }),
    
    /**
     * Get the fetch function for cities based on state
     * 
     * @returns A function that fetches cities based on state ID
     */
    cities: () => 
      createFetchFunction({
        endpoint: '/api/masters/city',
        labelKey: 'name',
        valueKey: 'id',
        dependencies: 'stateId',
        queryKeyPrefix: 'cities',
      }),
    
    /**
     * Get the fetch function for areas based on city
     * 
     * @returns A function that fetches areas based on city ID
     */
    areas: () => 
      createFetchFunction({
        endpoint: '/api/masters/area',
        labelKey: 'name',
        valueKey: 'id',
        dependencies: 'cityId',
        queryKeyPrefix: 'areas',
      }),
  };
};

/**
 * Create a generic fetch function for any entity
 * 
 * @param endpoint The API endpoint
 * @param dependencyField The field to use as a dependency
 * @param paramName The parameter name to use in the API request (defaults to dependencyField)
 * @returns A function that fetches dependent options
 */
export function createDependentFetchFunction(
  endpoint: string,
  dependencyField: string,
  paramName?: string
) {
  const { createFetchFunction } = useDependentFields();
  
  return createFetchFunction({
    endpoint,
    labelKey: 'name',
    valueKey: 'id',
    dependencies: {
      [paramName || dependencyField]: dependencyField,
    },
    queryKeyPrefix: `dependent-${endpoint}-${dependencyField}`,
  });
}
