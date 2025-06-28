import { z } from 'zod';

/**
 * Zod validation schema for Group form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const groupFormSchema = z.object({
  keycloakGroupId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  name: z.string().min(2).max(100),
  path: z.string().max(500),
  description: z.string().max(255).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  members: z.array(z.number()).optional(),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

// Individual field schemas for granular validation
export const groupFieldSchemas = {
  keycloakGroupId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  name: z.string().min(2).max(100),
  path: z.string().max(500),
  description: z.string().max(255).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  members: z.array(z.number()).optional(),
};

// Step-specific validation schemas
export const groupStepSchemas = {
  basic: z.object({
    keycloakGroupId: groupFieldSchemas.keycloakGroupId,
    name: groupFieldSchemas.name,
    path: groupFieldSchemas.path,
    description: groupFieldSchemas.description,
  }),

  settings: z.object({
    isActive: groupFieldSchemas.isActive,
  }),

  user: z.object({
    members: groupFieldSchemas.members,
  }),
  other: z.object({
    organization: groupFieldSchemas.organization,
  }),

  review: groupFormSchema,
};

// Validation helper functions
export const groupValidationHelpers = {
  validateStep: (stepId: string, data: Partial<GroupFormValues>) => {
    const stepSchema = groupStepSchemas[stepId as keyof typeof groupStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = groupFieldSchemas[fieldName as keyof typeof groupFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'keycloakGroupId') {
      return {
        required: true,
        pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      };
    }
    if (fieldName === 'name') {
      return {
        required: true,
        minLength: 2,
        maxLength: 100,
      };
    }
    if (fieldName === 'path') {
      return {
        required: true,
        maxLength: 500,
      };
    }
    if (fieldName === 'description') {
      return {
        required: false,
        maxLength: 255,
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
