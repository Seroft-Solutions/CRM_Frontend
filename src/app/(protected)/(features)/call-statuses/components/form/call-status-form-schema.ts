import { z } from "zod";

/**
 * Zod validation schema for CallStatus form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callStatusFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
});

export type CallStatusFormValues = z.infer<typeof callStatusFormSchema>;

// Individual field schemas for granular validation
export const callStatusFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
};

// Step-specific validation schemas
export const callStatusStepSchemas = {
  basic: z.object({
    name: callStatusFieldSchemas.name,
    description: callStatusFieldSchemas.description,
    remark: callStatusFieldSchemas.remark,
  }),
  
  
  
  
  review: callStatusFormSchema
};

// Validation helper functions
export const callStatusValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CallStatusFormValues>) => {
    const stepSchema = callStatusStepSchemas[stepId as keyof typeof callStatusStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = callStatusFieldSchemas[fieldName as keyof typeof callStatusFieldSchemas];
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
        maxLength: 50,
      };
    }
    if (fieldName === 'description') {
      return {
        required: false,
        maxLength: 255,
      };
    }
    if (fieldName === 'remark') {
      return {
        required: false,
        maxLength: 1000,
      };
    }
    
    return {};
  }
};
