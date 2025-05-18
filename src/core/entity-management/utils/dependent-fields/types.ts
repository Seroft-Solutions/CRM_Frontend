/**
 * Configuration for dynamic dependency mapping
 */
export interface DependencyParamConfig {
  /**
   * The parent field that the dependent field relies on
   */
  parentField: string;
  
  /**
   * The name of the query parameter to use when making the API request
   * @default same as parentField
   */
  paramName?: string;
  
  /**
   * Optional transform function to modify the dependency value before using it
   */
  transform?: (value: any) => any;
  
  /**
   * Whether this dependency is required for the API call to proceed
   * @default true
   */
  required?: boolean;
}

/**
 * Configuration for creating a fetch function
 */
export interface FetchOptionsConfig {
  /**
   * The API endpoint to fetch options from
   */
  endpoint: string;
  
  /**
   * The parameter in the API response to use as the option label
   * @default 'name'
   */
  labelKey?: string;
  
  /**
   * The parameter in the API response to use as the option value
   * @default 'id'
   */
  valueKey?: string;
  
  /**
   * Path to the array of items in the response
   * Examples: 'content', 'data', 'data.items'
   */
  contentPath?: string;
  
  /**
   * Dependency mapping configuration
   * 
   * Can be:
   * - A simple string (the parent field name)
   * - An array of strings (multiple parent field names)
   * - A Record object mapping parameter names to field names
   * - An array of DependencyParamConfig objects for complex mapping
   */
  dependencies?: string | string[] | Record<string, string> | DependencyParamConfig[];
  
  /**
   * Whether to include the dependency values as path parameters instead of query parameters
   * @default false
   */
  usePathParams?: boolean;
  
  /**
   * Additional static query parameters to include in every request
   */
  staticParams?: Record<string, any>;
  
  /**
   * Function to transform the entire dependency object before creating the request
   */
  transformDependencies?: (dependencies: Record<string, any>) => Record<string, any>;
  
  /**
   * Stale time for React Query caching (in milliseconds)
   * @default 5 minutes (5 * 60 * 1000)
   */
  staleTime?: number;
  
  /**
   * Cache time for React Query caching (in milliseconds)
   * @default 10 minutes (10 * 60 * 1000)
   */
  cacheTime?: number;
  
  /**
   * Query key prefix for React Query caching
   * @default dependent-[endpoint]
   */
  queryKeyPrefix?: string;
}

/**
 * Standard option format used throughout the application
 */
export interface OptionItem {
  /**
   * Display label for the option
   */
  label: string;
  
  /**
   * Value used when the option is selected
   */
  value: string;
  
  /**
   * Optional additional data associated with the option
   */
  data?: any;
  
  /**
   * Whether the option is disabled
   */
  disabled?: boolean;
  
  /**
   * Group that the option belongs to (for grouped selects)
   */
  group?: string;
  
  /**
   * Any additional properties
   */
  [key: string]: any;
}

/**
 * Function type for fetching dependent options
 */
export type FetchOptionsFunction = (dependencyValues: Record<string, any>) => Promise<OptionItem[]>;

/**
 * Hook result for useDependentFields
 */
export interface UseDependentFieldsResult {
  /**
   * Fetch options for a dependent select field
   * 
   * @param config Configuration for the fetch operation
   * @param dependencies Values of the dependency fields
   * @returns An array of options in { label, value } format
   */
  fetchOptions: (config: FetchOptionsConfig, dependencyValues: Record<string, any>) => Promise<OptionItem[]>;
  
  /**
   * Create a fetch function for a specific endpoint configuration
   * 
   * @param config The endpoint configuration or a simple endpoint string
   * @returns A function that takes dependencies and returns options
   */
  createFetchFunction: (config: string | FetchOptionsConfig) => FetchOptionsFunction;
  
  /**
   * Prefetch options for a dependent field to improve UI responsiveness
   * 
   * @param config The endpoint configuration
   * @param dependencies The dependency values
   * @param queryKey The query key to use for caching
   */
  prefetchOptions: (config: FetchOptionsConfig, dependencies: Record<string, any>, queryKey: unknown[]) => void;
  
  /**
   * Process dependencies based on various input formats
   * 
   * @param dependencies The dependency configuration
   * @param dependencyValues The current values of all fields
   * @returns Processed dependency object ready for API request
   */
  processDependencies: (
    dependencyConfig: FetchOptionsConfig['dependencies'], 
    dependencyValues: Record<string, any>
  ) => Record<string, any>;
}
