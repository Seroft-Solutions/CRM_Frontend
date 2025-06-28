import { z } from 'zod';

/**
 * Zod validation schema for District form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const districtFormSchema = z.object({
  name: z.string().min(2).max(100),
  state: z.number(),
});

export type DistrictFormValues = z.infer<typeof districtFormSchema>;

// Individual field schemas for granular validation
export const districtFieldSchemas = {
  name: z.string().min(2).max(100),
  state: z.number(),
};

// Step-specific validation schemas
export const districtStepSchemas = {
  basic: z.object({
    name: districtFieldSchemas.name,
  }),

  geographic: z.object({
    state: districtFieldSchemas.state,
  }),

  review: districtFormSchema,
};

// Validation helper functions
export const districtValidationHelpers = {
  validateStep: (stepId: string, data: Partial<DistrictFormValues>) => {
    const stepSchema = districtStepSchemas[stepId as keyof typeof districtStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = districtFieldSchemas[fieldName as keyof typeof districtFieldSchemas];
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
  },
};
