import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/features/core/tanstack-query-api/core/apiClient';
import { UseApiQueryOptions } from '@/features/core/tanstack-query-api';

/**
 * Options for the useSelectOptions hook
 */
export interface SelectOptionsConfig {
  /**
   * API endpoint to fetch options
   */
  endpoint: string;
  
  /**
   * The property name to use as the label in the returned options
   * @default 'name'
   */
  labelKey?: string;
  
  /**
   * The property name to use as the value in the returned options
   * @default 'id'
   */
  valueKey?: string;
  
  /**
   * Path to the array of items in the response
   * Examples: 'content', 'data', 'data.items'
   */
  contentPath?: string;
  
  /**
   * Additional query options for the API request
   */
  queryOptions?: UseApiQueryOptions<any>;
  
  /**
   * Dependencies that will trigger refetching when changed
   * This can be a string, string array, or an object with dependency values
   */
  dependencies?: string | string[] | Record<string, any>;
  
  /**
   * How long to consider the data "fresh" (in milliseconds)
   * @default 5 minutes
   */
  staleTime?: number;
  
  /**
   * Cache time for the query (in milliseconds)
   * @default 10 minutes
   */
  cacheTime?: number;
  
  /**
   * Transform function to convert API response to options format
   */
  transformResponse?: (data: any) => Array<{ label: string; value: string }>;
  
  /**
   * Debug mode to log API requests and responses
   */
  debug?: boolean;
}

/**
 * Hook to fetch options for select fields from an API endpoint
 * 
 * @param config Configuration for the select options
 * @returns Object with options array and loading state
 */
export function useSelectOptions(config: SelectOptionsConfig) {
  const {
    endpoint,
    labelKey = 'name',
    valueKey = 'id',
    queryOptions,
    dependencies,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    transformResponse,
    debug = false,
  } = config;
  
  // Enable debugging if specified
  if (debug) {
    console.log(`[useSelectOptions] Setting up query for endpoint: ${endpoint}`);
    console.log(`[useSelectOptions] Dependencies:`, dependencies);
  }
  
  // Build query key based on endpoint and dependencies
  const queryKey = ['select-options', endpoint];
  
  // Add dependencies to query key if present
  if (dependencies) {
    if (typeof dependencies === 'string') {
      queryKey.push(dependencies);
    } else if (Array.isArray(dependencies)) {
      queryKey.push(...dependencies);
    } else {
      // For object dependencies, add each key-value pair
      Object.entries(dependencies).forEach(([key, value]) => {
        queryKey.push(`${key}:${value}`);
      });
    }
  }
  
  // Add queryOptions to query key if present
  if (queryOptions && queryOptions.params) {
    Object.entries(queryOptions.params).forEach(([key, value]) => {
      queryKey.push(`${key}:${value}`);
    });
  }
  
  if (debug) {
    console.log(`[useSelectOptions] Query key:`, queryKey);
  }
  
  // Custom transform function
  const defaultTransform = (data: any) => {
    if (!data) return [];
    
    // Extract data array using contentPath or common patterns
    let items = [];
    
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
        console.error(`[useSelectOptions] Error accessing contentPath:`, error);
      }
    }
    // Otherwise try common patterns
    else if (Array.isArray(data)) {
      items = data;
    } else if (data.content && Array.isArray(data.content)) {
      items = data.content;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
    }
    
    if (debug) {
      console.log(`[useSelectOptions] Data type:`, typeof data);
      console.log(`[useSelectOptions] Data structure:`, JSON.stringify(data).substring(0, 200));
      console.log(`[useSelectOptions] Extracted items:`, items);
    }
          
    return items
      .filter(item => item) // Filter out null/undefined items
      .map(item => ({
        label: item[labelKey] || String(item),
        value: String(item[valueKey] || item)
      }));
  };
  
  // Execute the query
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (debug) {
        console.log(`[useSelectOptions] Fetching data from: ${endpoint}`);
      }
      
      try {
        const response = await apiClient.get(endpoint, queryOptions);
        
        if (debug) {
          console.log(`[useSelectOptions] Response:`, response);
        }
        
        if (!response || !response.data) {
          if (debug) {
            console.warn(`[useSelectOptions] Empty response or no data from ${endpoint}`);
          }
          return [];
        }
        
        const transformedData = transformResponse 
          ? transformResponse(response.data)
          : defaultTransform(response.data);
          
        if (debug) {
          console.log(`[useSelectOptions] Transformed options:`, transformedData);
        }
        
        return transformedData;
      } catch (error) {
        console.error(`[useSelectOptions] Error fetching from ${endpoint}:`, error);
        return [];
      }
    },
    staleTime,
    gcTime: cacheTime,
  });
  
  if (debug && query.isError) {
    console.error(`[useSelectOptions] Query error:`, query.error);
  }
  
  return {
    options: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    status: query.status,
  };
}
