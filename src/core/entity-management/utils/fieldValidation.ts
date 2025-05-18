/**
 * Utility functions for field validation
 */

// Cache to prevent redundant validation
const validationCache = new WeakMap();
let lastValueStringified = '';

/**
 * Checks if a field value should be considered filled
 * 
 * @param value Any value to check
 * @param fieldName Optional field name for additional context
 * @returns boolean indicating if the field is considered filled
 */
export function hasValidValue(value: any, fieldName?: string): boolean {
  // Handle special cases for certain field names
  if (fieldName) {
    // Only log in development or when debugging is needed
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_VALIDATION) {
      console.log(`[ValidationUtil] Checking field ${fieldName} with value:`, value, 'type:', typeof value);
    }
  }

  // Undefined or null values are always empty
  if (value === undefined || value === null) {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: false - undefined/null`);
    return false;
  }
  
  // Empty strings or whitespace-only strings are empty
  if (typeof value === 'string' && value.trim() === '') {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: false - empty string`);
    return false;
  }
  
  // NaN is considered empty
  if (typeof value === 'number' && isNaN(value)) {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: false - NaN`);
    return false;
  }
  
  // Special case: 0 is a valid value for numbers
  if (typeof value === 'number') {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: true - number ${value}`);
    return true;
  }
  
  // Empty arrays are considered empty
  if (Array.isArray(value) && value.length === 0) {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: false - empty array`);
    return false;
  }
  
  // For objects, check if it has any properties
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: false - empty object`);
    return false;
  }
  
  // All other values are considered filled
  if (fieldName && process.env.DEBUG_VALIDATION) console.log(`[ValidationUtil] ${fieldName}: true - has value`);
  return true;
}

/**
 * Returns a deeply cloned copy of form values to prevent cross-references
 * Uses caching to prevent redundant processing of the same values
 * 
 * @param values Form values object
 * @returns Deep clone of form values
 */
export function isolateFormValues(values: Record<string, any>): Record<string, any> {
  // Skip validation if values haven't changed to prevent infinite loops
  try {
    // Create a simple hash of the values for comparison
    const valueStringified = JSON.stringify(values);
    
    // If the values haven't changed, return the cached result
    if (valueStringified === lastValueStringified && validationCache.has(values)) {
      return validationCache.get(values);
    }
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_VALIDATION) {
      console.log('[ValidationUtil] Isolating form values', values);
    }
    
    // Create a completely new object with no references to the original
    const clean: Record<string, any> = {};
    
    // Iterate through each key and explicitly create new values
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        const value = values[key];
        
        // Handle different value types appropriately
        if (value === null || value === undefined) {
          clean[key] = value;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          // For primitive types, direct assignment is fine
          clean[key] = value;
        } else if (typeof value === 'object') {
          // For objects (including arrays), do a deep clone
          try {
            clean[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            // Fallback for circular references or other JSON errors
            clean[key] = value;
          }
        }
      }
    }
    
    // Store in cache for future use
    lastValueStringified = valueStringified;
    validationCache.set(values, clean);
    
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_VALIDATION) {
      console.log('[ValidationUtil] Isolated values:', clean);
    }
    
    return clean;
  } catch (error) {
    console.error('[ValidationUtil] Error isolating form values:', error);
    // Create a completely fresh object as a fallback
    const fallback: Record<string, any> = {};
    
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        fallback[key] = values[key];
      }
    }
    
    return fallback;
  }
}

/**
 * Verifies if a required field is properly filled
 * 
 * @param values Form values
 * @param fieldName Field name to check
 * @returns boolean indicating if the field is properly filled
 */
export function isRequiredFieldFilled(values: Record<string, any>, fieldName: string): boolean {
  // Get the exact field value by name to prevent cross-field contamination
  const value = values[fieldName];
  // Use the validation function to check if it's filled
  return hasValidValue(value, fieldName);
}

/**
 * Gets a specific field value from form values
 * 
 * @param values Form values
 * @param fieldName Field name to get
 * @returns The field value
 */
export function getFieldValue(values: Record<string, any>, fieldName: string): any {
  return values[fieldName];
}
