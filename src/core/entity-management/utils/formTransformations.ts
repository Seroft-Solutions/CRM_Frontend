import { FormMode } from '../types';

/**
 * Interface for a form transformation function
 */
export interface FormTransformer<T = any> {
  /**
   * Transform form values before submission
   * @param data The form data to transform
   * @param mode The current form mode (view, create, edit)
   * @returns The transformed data
   */
  transformFormData: (data: any, mode: FormMode) => T;
  
  /**
   * Transform API data for display in the form
   * @param data The API data to transform for form display
   * @param mode The current form mode (view, create, edit)
   * @returns The transformed data for the form
   */
  transformApiData?: (data: T, mode: FormMode) => any;
  
  /**
   * Validate form data before submission
   * @param data The form data to validate
   * @param mode The current form mode (view, create, edit)
   * @returns void if valid, throws an error if invalid
   */
  validateFormData?: (data: any, mode: FormMode) => void;
}

/**
 * Transform a JS Date object to an ISO string (or keep string as-is)
 */
export const transformDateFields = (
  data: any,
  dateFields: string[]
): any => {
  const transformedData = { ...data };
  
  dateFields.forEach((field) => {
    if (transformedData[field] instanceof Date) {
      transformedData[field] = transformedData[field].toISOString();
    }
  });
  
  return transformedData;
};

/**
 * Transform nested objects into a flattened format for API submission
 */
export const flattenNestedFields = (
  data: any,
  nestedFields: Record<string, string>
): any => {
  const transformedData = { ...data };
  
  Object.entries(nestedFields).forEach(([nestedField, targetField]) => {
    if (transformedData[nestedField]) {
      const value = 
        typeof transformedData[nestedField] === 'object' && 'id' in transformedData[nestedField]
          ? transformedData[nestedField].id
          : transformedData[nestedField];
      
      transformedData[targetField] = value;
      delete transformedData[nestedField];
    }
  });
  
  return transformedData;
};

/**
 * Transform array fields for API submission
 */
export const transformArrayFields = (
  data: any,
  arrayFields: Record<string, { idField: string; targetField?: string }>
): any => {
  const transformedData = { ...data };
  
  Object.entries(arrayFields).forEach(([arrayField, config]) => {
    if (Array.isArray(transformedData[arrayField])) {
      const targetField = config.targetField || arrayField;
      
      // Extract IDs if objects, or use values directly if primitives
      const transformedArray = transformedData[arrayField].map((item) => {
        if (typeof item === 'object' && item !== null && config.idField in item) {
          return item[config.idField];
        }
        return item;
      });
      
      if (targetField !== arrayField) {
        transformedData[targetField] = transformedArray;
        delete transformedData[arrayField];
      } else {
        transformedData[arrayField] = transformedArray;
      }
    }
  });
  
  return transformedData;
};

/**
 * Remove null/undefined fields from an object
 */
export const removeEmptyFields = (
  data: any,
  fieldsToCheck?: string[]
): any => {
  const transformedData = { ...data };
  
  Object.keys(transformedData).forEach((key) => {
    if (
      (!fieldsToCheck || fieldsToCheck.includes(key)) &&
      (transformedData[key] === null || transformedData[key] === undefined)
    ) {
      delete transformedData[key];
    }
  });
  
  return transformedData;
};

/**
 * Transform boolean fields from string values
 */
export const transformBooleanFields = (
  data: any,
  booleanFields: string[]
): any => {
  const transformedData = { ...data };
  
  booleanFields.forEach((field) => {
    if (field in transformedData) {
      // Handle string representations of booleans
      if (transformedData[field] === 'true') {
        transformedData[field] = true;
      } else if (transformedData[field] === 'false') {
        transformedData[field] = false;
      }
    }
  });
  
  return transformedData;
};

/**
 * Compose multiple transformation functions together
 */
export const composeTransformers = (
  ...transformers: ((data: any, mode: FormMode) => any)[]
) => {
  return (data: any, mode: FormMode) => {
    return transformers.reduce((result, transformer) => {
      return transformer(result, mode);
    }, data);
  };
};

/**
 * Create a form transformer from a transformation function
 */
export const createFormTransformer = <T = any>(
  transformFormData: (data: any, mode: FormMode) => T,
  transformApiData?: (data: T, mode: FormMode) => any,
  validateFormData?: (data: any, mode: FormMode) => void
): FormTransformer<T> => {
  return {
    transformFormData,
    transformApiData,
    validateFormData,
  };
};
