// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * ChannelType form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const channelTypeFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  commissionRate: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 100, { message: 'Please enter a number 100 or lower' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const channelTypeFormSchema = z.object(channelTypeFormSchemaFields);

export type ChannelTypeFormValues = z.infer<typeof channelTypeFormSchema>;

// Individual field schemas for granular validation
export const channelTypeFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  commissionRate: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 100, { message: 'Please enter a number 100 or lower' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

// Step-specific validation schemas
export const channelTypeStepSchemas = {
  basic: z.object({
    name: channelTypeFieldSchemas.name,
    description: channelTypeFieldSchemas.description,
    commissionRate: channelTypeFieldSchemas.commissionRate,
    status: channelTypeFieldSchemas.status,
    createdBy: channelTypeFieldSchemas.createdBy,
    createdDate: channelTypeFieldSchemas.createdDate,
    lastModifiedBy: channelTypeFieldSchemas.lastModifiedBy,
    lastModifiedDate: channelTypeFieldSchemas.lastModifiedDate,
  }),

  review: channelTypeFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = channelTypeStepSchemas[stepId as keyof typeof channelTypeStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
