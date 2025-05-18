import { useApiQuery } from '@/features/core/tanstack-query-api';
import { useMemo } from 'react';
import { FetchOptionsConfig, useDependentFields } from '../utils/dependent-fields';

interface DependentOptionConfig {
  /**
   * Base endpoint to fetch options from
   */
  endpoint: string;
  
  /**
   * The property to use as the option label
   * @default 'name'
   */
  labelKey?: string;
  
  /**
   * The property to use as the option value
   * @default 'id'
   */
  valueKey?: string;
  
  /**
   * Dependencies for this endpoint. When a key matches a URL parameter,
   * it will be added to the URL directly, otherwise it will be added as a query parameter.
   * 
   * Example: 
   * - endpoint: '/api/countries/{countryId}/cities'
   * - dependencies: { countryId: '123' }
   * - result: '/api/countries/123/cities'
   * 
   * Example 2:
   * - endpoint: '/api/cities'
   * - dependencies: { countryId: '123' }
   * - result: '/api/cities?countryId=123'
   */
  dependencies?: Record<string, any>;
  
  /**
   * Additional query parameters to include in the request
   */
  queryParams?: Record<string, any>;
  
  /**
   * Cache time in milliseconds
   * @default 5 minutes
   */
  cacheTime?: number;
  
  /**
   * Stale time in milliseconds
   * @default 1 minute
   */
  staleTime?: number;
}

/**
 * Custom hook to fetch options for dependent select fields
 * 
 * @deprecated Use the new useDependentFields hook from utils/dependent-fields instead.
 * This hook is maintained for backward compatibility and will be removed in a future version.
 */
export function useDependentOptions(config: DependentOptionConfig) {
  const {
    endpoint,
    labelKey = 'name',
    valueKey = 'id',
    dependencies = {},
    queryParams = {},
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
  } = config;
  
  // Process the endpoint with any URL parameters
  const processedEndpoint = useMemo(() => {
    let url = endpoint;
    const queryParameters = { ...queryParams };
    
    // Process dependencies
    Object.entries(dependencies).forEach(([key, value]) => {
      // Skip undefined, null, or empty string values
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // If the endpoint contains a placeholder for this dependency, replace it
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, encodeURIComponent(String(value)));
      } else {
        // Otherwise, add it as a query parameter
        queryParameters[key] = value;
      }
    });
    
    // Add remaining query parameters
    const queryString = Object.entries(queryParameters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    if (queryString) {
      url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
    
    return url;
  }, [endpoint, dependencies, queryParams]);
  
  // Check if all dependencies that are URL parameters have values
  const hasRequiredDependencies = useMemo(() => {
    // Extract URL parameters from the endpoint
    const urlParams = [];
    let match;
    const regex = /{([^}]+)}/g;
    
    while ((match = regex.exec(endpoint)) !== null) {
      urlParams.push(match[1]);
    }
    
    // Check if all URL parameters have values in dependencies
    return urlParams.every(param => {
      const value = dependencies[param];
      return value !== undefined && value !== null && value !== '';
    });
  }, [endpoint, dependencies]);
  
  // Generate a query key that includes all dependencies for proper caching
  const queryKey = useMemo(() => {
    return [
      'dependentOptions',
      endpoint,
      ...Object.entries(dependencies).map(([key, value]) => `${key}:${value || 'null'}`),
    ];
  }, [endpoint, dependencies]);
  
  // Fetch options using the API query hook
  const { 
    data,
    isLoading,
    error
  } = useApiQuery(
    queryKey,
    processedEndpoint,
    {
      staleTime,
      cacheTime,
      enabled: hasRequiredDependencies,
    }
  );
  
  // Process the response data to get the options
  const options = useMemo(() => {
    if (!data) return [];
    
    let items: any[] = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      // Handle API response with content inside data property
      if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data.content && Array.isArray(data.content)) {
        items = data.content;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.results && Array.isArray(data.results)) {
        items = data.results;
      } else if (data.page && data.page.content && Array.isArray(data.page.content)) {
        items = data.page.content;
      }
    }
    
    // Map items to option format and filter out any empty values
    return items
      .map(item => ({
        label: item[labelKey] || item.label || item.name || String(item[valueKey] || item.id),
        value: String(item[valueKey] || item.value || item.id) // Ensure value is a string
      }))
      .filter(option => option.value !== '');
  }, [data, labelKey, valueKey]);
  
  return {
    options,
    isLoading,
    error,
    endpoint: processedEndpoint,
    hasRequiredDependencies
  };
}
