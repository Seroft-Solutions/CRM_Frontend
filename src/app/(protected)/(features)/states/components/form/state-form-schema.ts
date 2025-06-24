import { z } from "zod";

/**
 * Zod validation schema for State form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const stateFormSchema = z.object({
  name: z.string().min(2).max(100),
  country: z.string().min(2).max(50),
});

export type StateFormValues = z.infer<typeof stateFormSchema>;

// Individual field schemas for granular validation
export const stateFieldSchemas = {
  name: z.string().min(2).max(100),
  country: z.string().min(2).max(50),
};

// Step-specific validation schemas
export const stateStepSchemas = {
  basic: z.object({
    name: stateFieldSchemas.name,
    country: stateFieldSchemas.country,
  }),
  
  
  
  
  review: stateFormSchema
};

// Validation helper functions
export const stateValidationHelpers = {
  validateStep: (stepId: string, data: Partial<StateFormValues>) => {
    const stepSchema = stateStepSchemas[stepId as keyof typeof stateStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = stateFieldSchemas[fieldName as keyof typeof stateFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'name') {
      return {
        required: true,
        minLength: 2,
        maxLength: 100,
      };
    }
    if (fieldName === 'country') {
      return {
        required: true,
        minLength: 2,
        maxLength: 50,
      };
    }
    
    return {};
  }
};
