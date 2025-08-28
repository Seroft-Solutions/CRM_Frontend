// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * Group form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const groupFormSchemaFields = {
  keycloakGroupId: z
    .string({ message: 'Please enter keycloakgroupid' })
    .min(1, { message: 'Please enter keycloakgroupid' })
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: 'Please enter valid keycloakgroupid',
    }),
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  path: z
    .string({ message: 'Please enter path' })
    .min(1, { message: 'Please enter path' })
    .max(500, { message: 'Please enter no more than 500 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  organization: z.number().optional(),
  members: z.string().optional(),
};

export const groupFormSchema = z.object(groupFormSchemaFields);

export type GroupFormValues = z.infer<typeof groupFormSchema>;

// Individual field schemas for granular validation
export const groupFieldSchemas = {
  keycloakGroupId: z
    .string({ message: 'Please enter keycloakgroupid' })
    .min(1, { message: 'Please enter keycloakgroupid' })
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: 'Please enter valid keycloakgroupid',
    }),
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  path: z
    .string({ message: 'Please enter path' })
    .min(1, { message: 'Please enter path' })
    .max(500, { message: 'Please enter no more than 500 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  organization: z.number().optional(),
  members: z.string().optional(),
};

// Step-specific validation schemas
export const groupStepSchemas = {
  basic: z.object({
    keycloakGroupId: groupFieldSchemas.keycloakGroupId,
    name: groupFieldSchemas.name,
    path: groupFieldSchemas.path,
    description: groupFieldSchemas.description,
    status: groupFieldSchemas.status,
    createdBy: groupFieldSchemas.createdBy,
    createdDate: groupFieldSchemas.createdDate,
    lastModifiedBy: groupFieldSchemas.lastModifiedBy,
    lastModifiedDate: groupFieldSchemas.lastModifiedDate,
  }),

  review: groupFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = groupStepSchemas[stepId as keyof typeof groupStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
