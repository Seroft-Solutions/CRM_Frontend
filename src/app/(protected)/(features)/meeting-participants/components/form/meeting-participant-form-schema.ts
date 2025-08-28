// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * MeetingParticipant form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const meetingParticipantFormSchemaFields = {
  email: z
    .string({ message: 'Please enter email' })
    .min(1, { message: 'Please enter email' })
    .max(254, { message: 'Please enter no more than 254 characters' })
    .email({ message: 'Please enter a valid email address (example: name@company.com)' }),
  name: z.string().max(100, { message: 'Please enter no more than 100 characters' }).optional(),
  isRequired: z.boolean().optional(),
  hasAccepted: z.boolean().optional(),
  hasDeclined: z.boolean().optional(),
  responseDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  meeting: z.number().optional(),
};

export const meetingParticipantFormSchema = z.object(meetingParticipantFormSchemaFields);

export type MeetingParticipantFormValues = z.infer<typeof meetingParticipantFormSchema>;

// Individual field schemas for granular validation
export const meetingParticipantFieldSchemas = {
  email: z
    .string({ message: 'Please enter email' })
    .min(1, { message: 'Please enter email' })
    .max(254, { message: 'Please enter no more than 254 characters' })
    .email({ message: 'Please enter a valid email address (example: name@company.com)' }),
  name: z.string().max(100, { message: 'Please enter no more than 100 characters' }).optional(),
  isRequired: z.boolean().optional(),
  hasAccepted: z.boolean().optional(),
  hasDeclined: z.boolean().optional(),
  responseDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  meeting: z.number().optional(),
};

// Step-specific validation schemas
export const meetingParticipantStepSchemas = {
  basic: z.object({
    email: meetingParticipantFieldSchemas.email,
    name: meetingParticipantFieldSchemas.name,
    responseDateTime: meetingParticipantFieldSchemas.responseDateTime,
    status: meetingParticipantFieldSchemas.status,
    createdBy: meetingParticipantFieldSchemas.createdBy,
    createdDate: meetingParticipantFieldSchemas.createdDate,
    lastModifiedBy: meetingParticipantFieldSchemas.lastModifiedBy,
    lastModifiedDate: meetingParticipantFieldSchemas.lastModifiedDate,
  }),

  review: meetingParticipantFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema =
    meetingParticipantStepSchemas[stepId as keyof typeof meetingParticipantStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
