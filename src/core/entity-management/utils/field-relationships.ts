import { 
  DependentFieldRelationship, 
  FieldRelationships, 
  RelationshipType 
} from '../types/entity-form/field-relationships';
import { SelectFieldConfig } from '../types/entity-form';
import { EntityApiEndpoints } from '@/features/core/tanstack-query-api';

/**
 * Create a dependent field relationship configuration
 * 
 * @param dependentField Field that depends on other fields
 * @param parentFields Fields that the dependent field depends on
 * @param options Additional options for the relationship
 * @returns A field relationship configuration object
 */
export function createDependentFieldRelationship(
  dependentField: string,
  parentFields: string | string[],
  options?: {
    resetOnChange?: boolean;
    optionsEndpoint?: string;
    endpointsConfig?: EntityApiEndpoints;
    endpointKey?: string;
    entityConfig?: {
      valueProperty?: string;
      displayProperty?: string;
    };
    transformDependencies?: (dependencies: Record<string, any>) => Record<string, any>;
    display?: {
      placeholderMessage?: string;
      emptyOptionsMessage?: string;
      autoSelectSingleOption?: boolean;
    };
  }
): FieldRelationships {
  const relationship: DependentFieldRelationship = {
    type: RelationshipType.DEPENDS_ON,
    fields: parentFields,
    resetOnChange: options?.resetOnChange,
    optionsEndpoint: options?.optionsEndpoint,
    endpointsConfig: options?.endpointsConfig,
    endpointKey: options?.endpointKey,
    entityConfig: options?.entityConfig,
    transformDependencies: options?.transformDependencies,
    display: options?.display,
  };
  
  return {
    [dependentField]: [relationship]
  };
}

/**
 * Extract field relationships from field configurations
 * 
 * @param fields Array of field configs
 * @returns Field relationships configuration
 */
export function extractFieldRelationships(
  fields: Array<SelectFieldConfig | any>
): FieldRelationships {
  const relationships: FieldRelationships = {};
  
  fields.forEach(field => {
    if (field.type === 'select' && field.dependsOn) {
      // Process select fields with dependencies
      const relationship: DependentFieldRelationship = {
        type: RelationshipType.DEPENDS_ON,
        fields: field.dependsOn,
        resetOnChange: field.clearOnDependencyChange !== false,
        entityConfig: {
          valueProperty: 'value',
          displayProperty: 'label',
        },
        display: {
          placeholderMessage: field.missingDependenciesMessage,
          emptyOptionsMessage: field.noOptionsMessage,
          autoSelectSingleOption: field.autoSelectSingleOption,
        },
        transformDependencies: field.transformDependencyValues,
      };
      
      // Process endpoint config
      if (typeof field.options === 'object' && 'endpoint' in field.options) {
        relationship.optionsEndpoint = field.options.endpoint;
      }
      
      relationships[field.name] = [relationship];
    }
  });
  
  return relationships;
}

/**
 * Register dependent field relationships in the entity form
 * 
 * This is a convenience function to create a field relationships
 * configuration for use with the entity form
 * 
 * @param config Array of dependency configurations
 * @returns Field relationships configuration
 */
export function registerDependentFields(config: Array<{
  field: string;
  dependsOn: string | string[];
  endpoint?: string;
  endpointsConfig?: EntityApiEndpoints;
  endpointKey?: string;
  resetOnChange?: boolean;
  autoSelectSingleOption?: boolean;
  placeholderMessage?: string;
  emptyOptionsMessage?: string;
  transformDependencies?: (dependencies: Record<string, any>) => Record<string, any>;
}>): FieldRelationships {
  const relationships: FieldRelationships = {};
  
  config.forEach(item => {
    const relationship: DependentFieldRelationship = {
      type: RelationshipType.DEPENDS_ON,
      fields: item.dependsOn,
      resetOnChange: item.resetOnChange !== false,
      optionsEndpoint: item.endpoint,
      endpointsConfig: item.endpointsConfig,
      endpointKey: item.endpointKey,
      display: {
        placeholderMessage: item.placeholderMessage,
        emptyOptionsMessage: item.emptyOptionsMessage,
        autoSelectSingleOption: item.autoSelectSingleOption,
      },
      transformDependencies: item.transformDependencies,
    };
    
    relationships[item.field] = [relationship];
  });
  
  return relationships;
}
