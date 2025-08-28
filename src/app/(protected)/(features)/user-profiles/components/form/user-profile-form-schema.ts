// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * UserProfile form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const userProfileFormSchemaFields = {
  keycloakId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: 'Please enter valid keycloakid',
    })
    .optional(),
  firstName: z
    .string({ message: 'Please enter firstname' })
    .min(1, { message: 'Please enter firstname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  lastName: z
    .string({ message: 'Please enter lastname' })
    .min(1, { message: 'Please enter lastname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  email: z
    .string({ message: 'Please enter email' })
    .min(1, { message: 'Please enter email' })
    .email({ message: 'Please enter a valid email address (example: name@company.com)' }),
  phone: z
    .string()
    .max(20, { message: 'Please enter no more than 20 characters' })
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message:
        'Please enter a valid phone number (10-15 digits only). Example: 03001234567 or +923001234567',
    })
    .optional(),
  displayName: z
    .string()
    .max(200, { message: 'Please enter no more than 200 characters' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  internalUser: z.string().optional(),
  organizations: z.number().optional(),
  groups: z.number().optional(),
  roles: z.number().optional(),
  channelType: z.number().optional(),
};

export const userProfileFormSchema = z.object(userProfileFormSchemaFields);

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

// Individual field schemas for granular validation
export const userProfileFieldSchemas = {
  keycloakId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
      message: 'Please enter valid keycloakid',
    })
    .optional(),
  firstName: z
    .string({ message: 'Please enter firstname' })
    .min(1, { message: 'Please enter firstname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  lastName: z
    .string({ message: 'Please enter lastname' })
    .min(1, { message: 'Please enter lastname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  email: z
    .string({ message: 'Please enter email' })
    .min(1, { message: 'Please enter email' })
    .email({ message: 'Please enter a valid email address (example: name@company.com)' }),
  phone: z
    .string()
    .max(20, { message: 'Please enter no more than 20 characters' })
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message:
        'Please enter a valid phone number (10-15 digits only). Example: 03001234567 or +923001234567',
    })
    .optional(),
  displayName: z
    .string()
    .max(200, { message: 'Please enter no more than 200 characters' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  internalUser: z.string().optional(),
  organizations: z.number().optional(),
  groups: z.number().optional(),
  roles: z.number().optional(),
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
    status: userProfileFieldSchemas.status,
    createdBy: userProfileFieldSchemas.createdBy,
    createdDate: userProfileFieldSchemas.createdDate,
    lastModifiedBy: userProfileFieldSchemas.lastModifiedBy,
    lastModifiedDate: userProfileFieldSchemas.lastModifiedDate,
  }),

  review: userProfileFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = userProfileStepSchemas[stepId as keyof typeof userProfileStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
