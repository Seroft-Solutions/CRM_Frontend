// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * State form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const stateFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  country: z
    .string({ message: 'Please enter country' })
    .min(1, { message: 'Please enter country' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
};

export const stateFormSchema = z.object(stateFormSchemaFields);

export type StateFormValues = z.infer<typeof stateFormSchema>;

// Individual field schemas for granular validation
export const stateFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  country: z
    .string({ message: 'Please enter country' })
    .min(1, { message: 'Please enter country' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
};

// Step-specific validation schemas
export const stateStepSchemas = {
  basic: z.object({
    name: stateFieldSchemas.name,
    country: stateFieldSchemas.country,
    createdBy: stateFieldSchemas.createdBy,
    createdDate: stateFieldSchemas.createdDate,
    lastModifiedBy: stateFieldSchemas.lastModifiedBy,
    lastModifiedDate: stateFieldSchemas.lastModifiedDate,
  }),

  review: stateFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = stateStepSchemas[stepId as keyof typeof stateStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
