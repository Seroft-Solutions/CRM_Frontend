import { z } from "zod";

/**
 * Zod validation schema for Area form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const areaFormSchema = z.object({
  name: z.string().min(2).max(100),
  pincode: z.string().min(6).max(6).regex(/^[0-9]{6}$/),
  city: z.number().optional(),
});

export type AreaFormValues = z.infer<typeof areaFormSchema>;

// Individual field schemas for granular validation
export const areaFieldSchemas = {
  name: z.string().min(2).max(100),
  pincode: z.string().min(6).max(6).regex(/^[0-9]{6}$/),
  city: z.number().optional(),
};

// Step-specific validation schemas
export const areaStepSchemas = {
  basic: z.object({
    name: areaFieldSchemas.name,
    pincode: areaFieldSchemas.pincode,
  }),
  
  
  
  geographic: z.object({
    city: areaFieldSchemas.city,
  }),
  
  review: areaFormSchema
};

// Validation helper functions
export const areaValidationHelpers = {
  validateStep: (stepId: string, data: Partial<AreaFormValues>) => {
    const stepSchema = areaStepSchemas[stepId as keyof typeof areaStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = areaFieldSchemas[fieldName as keyof typeof areaFieldSchemas];
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
    if (fieldName === 'pincode') {
      return {
        required: true,
        minLength: 6,
        maxLength: 6,
        pattern: /^[0-9]{6}$/,
      };
    }
    
    return {};
  }
};
