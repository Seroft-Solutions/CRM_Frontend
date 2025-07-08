/**
 * Role form validation schema with user-friendly messages
 */
import { z } from "zod";

export const roleFormSchemaFields = {
  keycloakRoleId: z.string({ message: "Please enter keycloakroleid" }).min(1, { message: "Please enter keycloakroleid" }).regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Please enter valid keycloakroleid" }),
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(200, { message: "Please enter no more than 200 characters" }).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  users: z.string().optional(),
};

export const roleFormSchema = z.object(roleFormSchemaFields);

export type RoleFormValues = z.infer<typeof roleFormSchema>;

// Individual field schemas for granular validation
export const roleFieldSchemas = {
  keycloakRoleId: z.string({ message: "Please enter keycloakroleid" }).min(1, { message: "Please enter keycloakroleid" }).regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Please enter valid keycloakroleid" }),
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(200, { message: "Please enter no more than 200 characters" }).optional(),
  isActive: z.boolean(),
  organization: z.number().optional(),
  users: z.string().optional(),
};

// Step-specific validation schemas
export const roleStepSchemas = {
  basic: z.object({
    keycloakRoleId: roleFieldSchemas.keycloakRoleId,
    name: roleFieldSchemas.name,
    description: roleFieldSchemas.description,
    createdBy: roleFieldSchemas.createdBy,
    createdDate: roleFieldSchemas.createdDate,
    lastModifiedBy: roleFieldSchemas.lastModifiedBy,
    lastModifiedDate: roleFieldSchemas.lastModifiedDate,
  }),
  
  review: roleFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = roleStepSchemas[stepId as keyof typeof roleStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
