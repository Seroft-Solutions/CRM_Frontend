import { z } from 'zod';
import { createDependentFieldSchema, commonSchemas } from '../../validation';

/**
 * Creates a comprehensive schema setup for dependent field relationships
 * 
 * @param parentFieldKey The key of the parent field
 * @param parentFieldSchema The schema for the parent field
 * @param dependentFieldKey The key of the dependent field
 * @param dependentFieldRequired Whether the dependent field is required when the parent has a value
 * @param dependentFieldMessage Custom error message for the dependent field
 * @returns An object schema with proper parent-dependent field relationship
 */
export function createDependentRelationshipSchema(
  parentFieldKey: string,
  parentFieldSchema: z.ZodType,
  dependentFieldKey: string,
  dependentFieldRequired: boolean = false,
  dependentFieldMessage: string = 'This field is required when parent field has a value'
) {
  return z.object({
    [parentFieldKey]: parentFieldSchema,
    [dependentFieldKey]: createDependentFieldSchema(dependentFieldRequired, dependentFieldMessage)
  });
}

/**
 * Creates default values for dependent field relationships with proper null handling
 * 
 * @param parentFieldValue The default value for the parent field (usually empty string or null)
 * @returns An object with default values for both parent and dependent fields
 */
export function createDependentFieldDefaults(parentFieldValue: string | null = '') {
  return {
    // Parent field with provided default value
    parent: parentFieldValue,
    // Dependent field always starts as null (not empty string)
    dependent: null
  };
}

/**
 * Creates a transformation function for dependent field data
 * that properly handles null values
 * 
 * @param parentFieldKey The key of the parent field
 * @param dependentFieldKey The key of the dependent field
 * @param convertToNumber Whether to convert string IDs to numbers
 * @returns A transformer function for form data
 */
export function createDependentFieldTransformer(
  parentFieldKey: string,
  dependentFieldKey: string,
  convertToNumber: boolean = true
) {
  return (data: Record<string, any>) => {
    const transformed = { ...data };
    
    // Handle parent field
    if (convertToNumber && transformed[parentFieldKey] && typeof transformed[parentFieldKey] === 'string') {
      transformed[parentFieldKey] = parseInt(transformed[parentFieldKey], 10);
    }
    
    // Handle dependent field - ensure null if empty or null
    if (transformed[dependentFieldKey] === null || transformed[dependentFieldKey] === '') {
      transformed[dependentFieldKey] = null;
    } else if (convertToNumber && typeof transformed[dependentFieldKey] === 'string') {
      transformed[dependentFieldKey] = parseInt(transformed[dependentFieldKey], 10);
    }
    
    return transformed;
  };
}
