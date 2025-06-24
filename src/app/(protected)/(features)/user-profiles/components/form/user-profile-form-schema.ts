import { z } from "zod";

/**
 * Zod validation schema for UserProfile form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const userProfileFormSchema = z.object({
  keycloakId: z.string(),
  email: z.string().min(5).max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  organization: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  roles: z.array(z.number()).optional(),
  channelType: z.number().optional(),
});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

// Individual field schemas for granular validation
export const userProfileFieldSchemas = {
  keycloakId: z.string(),
  email: z.string().min(5).max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  organization: z.array(z.number()).optional(),
  groups: z.array(z.number()).optional(),
  roles: z.array(z.number()).optional(),
  channelType: z.number().optional(),
};

// Step-specific validation schemas
export const userProfileStepSchemas = {
  basic: z.object({
    keycloakId: userProfileFieldSchemas.keycloakId,
    email: userProfileFieldSchemas.email,
    firstName: userProfileFieldSchemas.firstName,
    lastName: userProfileFieldSchemas.lastName,
  }),
  
  
  
  classification: z.object({
    channelType: userProfileFieldSchemas.channelType,
  }),
  other: z.object({
    organization: userProfileFieldSchemas.organization,
    groups: userProfileFieldSchemas.groups,
    roles: userProfileFieldSchemas.roles,
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
        required: true,
      };
    }
    if (fieldName === 'email') {
      return {
        required: true,
        minLength: 5,
        maxLength: 100,
      };
    }
    if (fieldName === 'firstName') {
      return {
        required: false,
        maxLength: 50,
      };
    }
    if (fieldName === 'lastName') {
      return {
        required: false,
        maxLength: 50,
      };
    }
    
    return {};
  }
};
