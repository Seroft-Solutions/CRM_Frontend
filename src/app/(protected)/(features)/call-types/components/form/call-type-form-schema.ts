import { z } from "zod";

/**
 * Zod validation schema for CallType form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callTypeFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
});

export type CallTypeFormValues = z.infer<typeof callTypeFormSchema>;

// Individual field schemas for granular validation
export const callTypeFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
};

// Step-specific validation schemas
export const callTypeStepSchemas = {
  basic: z.object({
    name: callTypeFieldSchemas.name,
    description: callTypeFieldSchemas.description,
    remark: callTypeFieldSchemas.remark,
  }),
  
  
  
  
  review: callTypeFormSchema
};

// Validation helper functions
export const callTypeValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CallTypeFormValues>) => {
    const stepSchema = callTypeStepSchemas[stepId as keyof typeof callTypeStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = callTypeFieldSchemas[fieldName as keyof typeof callTypeFieldSchemas];
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
