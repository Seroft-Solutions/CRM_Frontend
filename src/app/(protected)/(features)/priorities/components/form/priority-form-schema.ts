// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * Priority form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const priorityFormSchemaFields = {
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
};

export const priorityFormSchema = z.object(priorityFormSchemaFields);

export type PriorityFormValues = z.infer<typeof priorityFormSchema>;

// Individual field schemas for granular validation
export const priorityFieldSchemas = {
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
};

// Step-specific validation schemas
export const priorityStepSchemas = {
  basic: z.object({
    name: priorityFieldSchemas.name,
    description: priorityFieldSchemas.description,
    remark: priorityFieldSchemas.remark,
    createdBy: priorityFieldSchemas.createdBy,
    createdDate: priorityFieldSchemas.createdDate,
    lastModifiedBy: priorityFieldSchemas.lastModifiedBy,
    lastModifiedDate: priorityFieldSchemas.lastModifiedDate,
  }),

  review: priorityFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = priorityStepSchemas[stepId as keyof typeof priorityStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
