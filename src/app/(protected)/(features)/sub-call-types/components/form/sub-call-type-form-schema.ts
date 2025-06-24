import { z } from 'zod';

/**
 * Zod validation schema for SubCallType form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const subCallTypeFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
  callType: z.number(),
});

export type SubCallTypeFormValues = z.infer<typeof subCallTypeFormSchema>;

// Individual field schemas for granular validation
export const subCallTypeFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
  callType: z.number(),
};

// Step-specific validation schemas
export const subCallTypeStepSchemas = {
  basic: z.object({
    name: subCallTypeFieldSchemas.name,
    description: subCallTypeFieldSchemas.description,
    remark: subCallTypeFieldSchemas.remark,
  }),

  classification: z.object({
    callType: subCallTypeFieldSchemas.callType,
  }),

  review: subCallTypeFormSchema,
};

// Validation helper functions
export const subCallTypeValidationHelpers = {
  validateStep: (stepId: string, data: Partial<SubCallTypeFormValues>) => {
    const stepSchema = subCallTypeStepSchemas[stepId as keyof typeof subCallTypeStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = subCallTypeFieldSchemas[fieldName as keyof typeof subCallTypeFieldSchemas];
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
