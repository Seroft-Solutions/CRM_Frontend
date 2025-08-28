// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * CallType form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const callTypeFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const callTypeFormSchema = z.object(callTypeFormSchemaFields);

export type CallTypeFormValues = z.infer<typeof callTypeFormSchema>;

// Individual field schemas for granular validation
export const callTypeFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

// Step-specific validation schemas
export const callTypeStepSchemas = {
  basic: z.object({
    name: callTypeFieldSchemas.name,
    description: callTypeFieldSchemas.description,
    remark: callTypeFieldSchemas.remark,
    status: callTypeFieldSchemas.status,
    createdBy: callTypeFieldSchemas.createdBy,
    createdDate: callTypeFieldSchemas.createdDate,
    lastModifiedBy: callTypeFieldSchemas.lastModifiedBy,
    lastModifiedDate: callTypeFieldSchemas.lastModifiedDate,
  }),

  review: callTypeFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = callTypeStepSchemas[stepId as keyof typeof callTypeStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
