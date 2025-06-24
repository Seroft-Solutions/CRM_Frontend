import { z } from "zod";

/**
 * Zod validation schema for City form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const cityFormSchema = z.object({
  name: z.string().min(2).max(100),
  district: z.number().optional(),
});

export type CityFormValues = z.infer<typeof cityFormSchema>;

// Individual field schemas for granular validation
export const cityFieldSchemas = {
  name: z.string().min(2).max(100),
  district: z.number().optional(),
};

// Step-specific validation schemas
export const cityStepSchemas = {
  basic: z.object({
    name: cityFieldSchemas.name,
  }),
  
  
  
  geographic: z.object({
    district: cityFieldSchemas.district,
  }),
  
  review: cityFormSchema
};

// Validation helper functions
export const cityValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CityFormValues>) => {
    const stepSchema = cityStepSchemas[stepId as keyof typeof cityStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = cityFieldSchemas[fieldName as keyof typeof cityFieldSchemas];
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
    
    return {};
  }
};
