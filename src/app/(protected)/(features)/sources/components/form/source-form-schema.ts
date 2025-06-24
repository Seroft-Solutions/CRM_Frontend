import { z } from 'zod';

/**
 * Zod validation schema for Source form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const sourceFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
});

export type SourceFormValues = z.infer<typeof sourceFormSchema>;

// Individual field schemas for granular validation
export const sourceFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
};

// Step-specific validation schemas
export const sourceStepSchemas = {
  basic: z.object({
    name: sourceFieldSchemas.name,
    description: sourceFieldSchemas.description,
    remark: sourceFieldSchemas.remark,
  }),

  review: sourceFormSchema,
};

// Validation helper functions
export const sourceValidationHelpers = {
  validateStep: (stepId: string, data: Partial<SourceFormValues>) => {
    const stepSchema = sourceStepSchemas[stepId as keyof typeof sourceStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = sourceFieldSchemas[fieldName as keyof typeof sourceFieldSchemas];
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
