import { z } from "zod";

/**
 * Zod validation schema for Organization form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const organizationFormSchema = z.object({
  keycloakOrgId: z.string(),
  name: z.string().min(2).max(100),
  displayName: z.string().max(150).optional(),
  domain: z.string().max(100).optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

// Individual field schemas for granular validation
export const organizationFieldSchemas = {
  keycloakOrgId: z.string(),
  name: z.string().min(2).max(100),
  displayName: z.string().max(150).optional(),
  domain: z.string().max(100).optional(),
};

// Step-specific validation schemas
export const organizationStepSchemas = {
  basic: z.object({
    keycloakOrgId: organizationFieldSchemas.keycloakOrgId,
    name: organizationFieldSchemas.name,
    displayName: organizationFieldSchemas.displayName,
    domain: organizationFieldSchemas.domain,
  }),
  
  
  
  
  review: organizationFormSchema
};

// Validation helper functions
export const organizationValidationHelpers = {
  validateStep: (stepId: string, data: Partial<OrganizationFormValues>) => {
    const stepSchema = organizationStepSchemas[stepId as keyof typeof organizationStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = organizationFieldSchemas[fieldName as keyof typeof organizationFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'keycloakOrgId') {
      return {
        required: true,
      };
    }
    if (fieldName === 'name') {
      return {
        required: true,
        minLength: 2,
        maxLength: 100,
      };
    }
    if (fieldName === 'displayName') {
      return {
        required: false,
        maxLength: 150,
      };
    }
    if (fieldName === 'domain') {
      return {
        required: false,
        maxLength: 100,
      };
    }
    
    return {};
  }
};
