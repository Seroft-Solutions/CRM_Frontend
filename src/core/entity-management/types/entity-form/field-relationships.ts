import { EntityApiEndpoints } from '@/features/core/tanstack-query-api';

/**
 * Field relationship types for defining dependencies between fields
 */
export enum RelationshipType {
  DEPENDS_ON = 'dependsOn',
  PARENT_OF = 'parentOf',
  FILTER_FOR = 'filterFor',
  FILTERED_BY = 'filteredBy'
}

/**
 * Configuration for dependent relationship between fields
 */
export interface DependentFieldRelationship {
  /**
   * Type of relationship between fields
   */
  type: RelationshipType;
  
  /**
   * Field name(s) that this field depends on
   */
  fields: string | string[];
  
  /**
   * Whether to reset this field's value when dependency changes
   * @default true
   */
  resetOnChange?: boolean;
  
  /**
   * API endpoint to fetch options when dependencies change
   * Can be a string template with :param placeholders that will be
   * replaced with dependency values
   * Example: "/api/states/:countryId/cities"
   */
  optionsEndpoint?: string;
  
  /**
   * EntityApiEndpoints object to use for fetching options
   * This is used with the endpointKey to build the API url
   */
  endpointsConfig?: EntityApiEndpoints;
  
  /**
   * Key from the endpoints object to use
   * For example: "subTypes.list" would translate to
   * endpointsConfig.subTypes.list(dependencyValue)
   */
  endpointKey?: string;
  
  /**
   * Configuration for entity resolution when using entity references
   */
  entityConfig?: {
    /**
     * The name of the entity property to use as the field value
     * @default "id"
     */
    valueProperty?: string;
    
    /**
     * The name of the entity property to display
     * @default "name"
     */
    displayProperty?: string;
  };
  
  /**
   * Function to transform dependency values before building URL or making requests
   */
  transformDependencies?: (dependencies: Record<string, any>) => Record<string, any>;
  
  /**
   * Display configuration
   */
  display?: {
    /**
     * Message to show when dependencies are not selected
     */
    placeholderMessage?: string;
    
    /**
     * Message to show when no options are available
     */
    emptyOptionsMessage?: string;
    
    /**
     * Whether to auto-select a single option
     * @default false
     */
    autoSelectSingleOption?: boolean;
  };
}

/**
 * Extended field config with relationship information
 * To be used in the entity form configuration
 */
export interface FieldRelationships {
  [fieldName: string]: DependentFieldRelationship[];
}
