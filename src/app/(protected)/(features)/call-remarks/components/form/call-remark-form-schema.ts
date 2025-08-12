// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * CallRemark form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const callRemarkFormSchemaFields = {
  remark: z
    .string({ message: 'Please enter remark' })
    .min(1, { message: 'Please enter remark' })
    .max(2000, { message: 'Please enter no more than 2000 characters' }),
  dateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    }),
  call: z.number({ message: 'Please select call from the dropdown' }),
};

export const callRemarkFormSchema = z.object(callRemarkFormSchemaFields);

export type CallRemarkFormValues = z.infer<typeof callRemarkFormSchema>;

// Individual field schemas for granular validation
export const callRemarkFieldSchemas = {
  remark: z
    .string({ message: 'Please enter remark' })
    .min(1, { message: 'Please enter remark' })
    .max(2000, { message: 'Please enter no more than 2000 characters' }),
  dateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    }),
  call: z.number({ message: 'Please select call from the dropdown' }),
};

// Step-specific validation schemas
export const callRemarkStepSchemas = {
  basic: z.object({
    remark: callRemarkFieldSchemas.remark,
    dateTime: callRemarkFieldSchemas.dateTime,
    createdBy: callRemarkFieldSchemas.createdBy,
    createdDate: callRemarkFieldSchemas.createdDate,
    lastModifiedBy: callRemarkFieldSchemas.lastModifiedBy,
    lastModifiedDate: callRemarkFieldSchemas.lastModifiedDate,
  }),

  review: callRemarkFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = callRemarkStepSchemas[stepId as keyof typeof callRemarkStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
