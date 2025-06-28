import { z } from 'zod';

/**
 * Zod validation schema for Role form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const roleFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  users: z.array(z.number()).optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

// Individual field schemas for granular validation
export const roleFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  users: z.array(z.number()).optional(),
};

// Step-specific validation schemas
export const roleStepSchemas = {
  basic: z.object({
    name: roleFieldSchemas.name,
    description: roleFieldSchemas.description,
  }),

  settings: z.object({
    isActive: roleFieldSchemas.isActive,
  }),

  user: z.object({
    users: roleFieldSchemas.users,
  }),
  other: z.object({
    organization: roleFieldSchemas.organization,
  }),

  review: roleFormSchema,
};

// Validation helper functions
export const roleValidationHelpers = {
  validateStep: (stepId: string, data: Partial<RoleFormValues>) => {
    const stepSchema = roleStepSchemas[stepId as keyof typeof roleStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = roleFieldSchemas[fieldName as keyof typeof roleFieldSchemas];
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
        maxLength: 200,
      };
    }
    if (fieldName === 'isActive') {
      return {
        required: true,
      };
    }

    return {};
  },
};
