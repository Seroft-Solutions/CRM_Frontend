import { z } from 'zod';

/**
 * Zod validation schema for UserProfile form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const userProfileFormSchema = z.object({
  keycloakId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    .optional(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  phone: z
    .string()
    .max(20)
    .regex(/^[+]?[0-9\s\-\(\)]{10,20}$/)
    .optional(),
  displayName: z.string().max(200).optional(),
  organizations: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  roles: z.array(z.number()).optional(),
  channelType: z.number().optional(),
});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

// Individual field schemas for granular validation
export const userProfileFieldSchemas = {
  keycloakId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    .optional(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  phone: z
    .string()
    .max(20)
    .regex(/^[+]?[0-9\s\-\(\)]{10,20}$/)
    .optional(),
  displayName: z.string().max(200).optional(),
  organizations: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  roles: z.array(z.number()).optional(),
  channelType: z.number().optional(),
};

// Step-specific validation schemas
export const userProfileStepSchemas = {
  basic: z.object({
    keycloakId: userProfileFieldSchemas.keycloakId,
    firstName: userProfileFieldSchemas.firstName,
    lastName: userProfileFieldSchemas.lastName,
    email: userProfileFieldSchemas.email,
    phone: userProfileFieldSchemas.phone,
    displayName: userProfileFieldSchemas.displayName,
  }),

  classification: z.object({
    channelType: userProfileFieldSchemas.channelType,
  }),
  other: z.object({
    organizations: userProfileFieldSchemas.organizations,
    groups: userProfileFieldSchemas.groups,
    roles: userProfileFieldSchemas.roles,
  }),

  review: userProfileFormSchema,
};

// Validation helper functions
export const userProfileValidationHelpers = {
  validateStep: (stepId: string, data: Partial<UserProfileFormValues>) => {
    const stepSchema = userProfileStepSchemas[stepId as keyof typeof userProfileStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = userProfileFieldSchemas[fieldName as keyof typeof userProfileFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'keycloakId') {
      return {
        required: false,
        pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      };
    }
    if (fieldName === 'firstName') {
      return {
        required: true,
        minLength: 2,
        maxLength: 50,
      };
    }
    if (fieldName === 'lastName') {
      return {
        required: true,
        minLength: 2,
        maxLength: 50,
      };
    }
    if (fieldName === 'email') {
      return {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      };
    }
    if (fieldName === 'phone') {
      return {
        required: false,
        maxLength: 20,
        pattern: /^[+]?[0-9\s\-\(\)]{10,20}$/,
      };
    }
    if (fieldName === 'displayName') {
      return {
        required: false,
        maxLength: 200,
      };
    }

    return {};
  },
};
