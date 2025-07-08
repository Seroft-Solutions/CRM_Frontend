/**
 * Organization form validation schema with user-friendly messages
 */
import { z } from "zod";

export const organizationFormSchemaFields = {
  keycloakOrgId: z.string({ message: "Please enter keycloakorgid" }).min(1, { message: "Please enter keycloakorgid" }).regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Please enter valid keycloakorgid" }),
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  displayName: z.string().max(150, { message: "Please enter no more than 150 characters" }).optional(),
  domain: z.string().max(100, { message: "Please enter no more than 100 characters" }).regex(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, { message: "Please enter valid domain" }).optional(),
  isActive: z.boolean(),
  members: z.string().optional(),
};

export const organizationFormSchema = z.object(organizationFormSchemaFields);

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

// Individual field schemas for granular validation
export const organizationFieldSchemas = {
  keycloakOrgId: z.string({ message: "Please enter keycloakorgid" }).min(1, { message: "Please enter keycloakorgid" }).regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Please enter valid keycloakorgid" }),
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  displayName: z.string().max(150, { message: "Please enter no more than 150 characters" }).optional(),
  domain: z.string().max(100, { message: "Please enter no more than 100 characters" }).regex(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, { message: "Please enter valid domain" }).optional(),
  isActive: z.boolean(),
  members: z.string().optional(),
};

// Step-specific validation schemas
export const organizationStepSchemas = {
  basic: z.object({
    keycloakOrgId: organizationFieldSchemas.keycloakOrgId,
    name: organizationFieldSchemas.name,
    displayName: organizationFieldSchemas.displayName,
    domain: organizationFieldSchemas.domain,
    createdBy: organizationFieldSchemas.createdBy,
    createdDate: organizationFieldSchemas.createdDate,
    lastModifiedBy: organizationFieldSchemas.lastModifiedBy,
    lastModifiedDate: organizationFieldSchemas.lastModifiedDate,
  }),
  
  review: organizationFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = organizationStepSchemas[stepId as keyof typeof organizationStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
