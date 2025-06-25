import { z } from "zod";

/**
 * Zod validation schema for UserProfile form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const userProfileFormSchema = z.object({
  keycloakId: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).optional(),
  phone: z.string().max(20).regex(/^[+]?[0-9\s\-\(\)]{10,20}$/).optional(),
  displayName: z.string().max(200).optional(),
  createdAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  updatedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  user: z.string().optional(),
  organizations: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  channelType: z.number().optional(),
});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

// Individual field schemas for granular validation
export const userProfileFieldSchemas = {
  keycloakId: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).optional(),
  phone: z.string().max(20).regex(/^[+]?[0-9\s\-\(\)]{10,20}$/).optional(),
  displayName: z.string().max(200).optional(),
  createdAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  updatedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  user: z.string().optional(),
  organizations: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  channelType: z.number().optional(),
};

// Step-specific validation schemas
export const userProfileStepSchemas = {
  basic: z.object({
    keycloakId: userProfileFieldSchemas.keycloakId,
    phone: userProfileFieldSchemas.phone,
    displayName: userProfileFieldSchemas.displayName,
  }),
  
  dates: z.object({
    createdAt: userProfileFieldSchemas.createdAt,
    updatedAt: userProfileFieldSchemas.updatedAt,
  }),
  
  
  user: z.object({
    user: userProfileFieldSchemas.user,
  }),
  classification: z.object({
    channelType: userProfileFieldSchemas.channelType,
  }),
  other: z.object({
    organizations: userProfileFieldSchemas.organizations,
    groups: userProfileFieldSchemas.groups,
  }),
  
  review: userProfileFormSchema
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
  }
};
