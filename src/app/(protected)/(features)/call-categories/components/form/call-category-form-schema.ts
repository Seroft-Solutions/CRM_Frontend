import { z } from 'zod';

/**
 * Zod validation schema for CallCategory form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callCategoryFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
});

export type CallCategoryFormValues = z.infer<typeof callCategoryFormSchema>;

// Individual field schemas for granular validation
export const callCategoryFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
};

// Step-specific validation schemas
export const callCategoryStepSchemas = {
  basic: z.object({
    name: callCategoryFieldSchemas.name,
    description: callCategoryFieldSchemas.description,
    remark: callCategoryFieldSchemas.remark,
  }),

  review: callCategoryFormSchema,
};

// Validation helper functions
export const callCategoryValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CallCategoryFormValues>) => {
    const stepSchema = callCategoryStepSchemas[stepId as keyof typeof callCategoryStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema =
      callCategoryFieldSchemas[fieldName as keyof typeof callCategoryFieldSchemas];
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
  },
};
