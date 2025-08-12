// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * MeetingReminder form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const meetingReminderFormSchemaFields = {
  reminderType: z
    .string({ message: 'Please enter remindertype' })
    .min(1, { message: 'Please enter remindertype' }),
  reminderMinutesBefore: z
    .string({ message: 'Please enter reminderminutesbefore' })
    .min(1, { message: 'Please enter reminderminutesbefore' })
    .refine((val) => !val || Number(val) >= 5, { message: 'Please enter a number 5 or higher' })
    .refine((val) => !val || Number(val) <= 43200, {
      message: 'Please enter a number 43200 or lower',
    }),
  isTriggered: z.boolean().optional(),
  triggeredAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    })
    .optional(),
  failureReason: z
    .string()
    .max(500, { message: 'Please enter no more than 500 characters' })
    .optional(),
  meeting: z.number().optional(),
};

export const meetingReminderFormSchema = z.object(meetingReminderFormSchemaFields);

export type MeetingReminderFormValues = z.infer<typeof meetingReminderFormSchema>;

// Individual field schemas for granular validation
export const meetingReminderFieldSchemas = {
  reminderType: z
    .string({ message: 'Please enter remindertype' })
    .min(1, { message: 'Please enter remindertype' }),
  reminderMinutesBefore: z
    .string({ message: 'Please enter reminderminutesbefore' })
    .min(1, { message: 'Please enter reminderminutesbefore' })
    .refine((val) => !val || Number(val) >= 5, { message: 'Please enter a number 5 or higher' })
    .refine((val) => !val || Number(val) <= 43200, {
      message: 'Please enter a number 43200 or lower',
    }),
  isTriggered: z.boolean().optional(),
  triggeredAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Please select a valid date and time',
    })
    .optional(),
  failureReason: z
    .string()
    .max(500, { message: 'Please enter no more than 500 characters' })
    .optional(),
  meeting: z.number().optional(),
};

// Step-specific validation schemas
export const meetingReminderStepSchemas = {
  basic: z.object({
    reminderType: meetingReminderFieldSchemas.reminderType,
    reminderMinutesBefore: meetingReminderFieldSchemas.reminderMinutesBefore,
    triggeredAt: meetingReminderFieldSchemas.triggeredAt,
    failureReason: meetingReminderFieldSchemas.failureReason,
    createdBy: meetingReminderFieldSchemas.createdBy,
    createdDate: meetingReminderFieldSchemas.createdDate,
    lastModifiedBy: meetingReminderFieldSchemas.lastModifiedBy,
    lastModifiedDate: meetingReminderFieldSchemas.lastModifiedDate,
  }),

  review: meetingReminderFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = meetingReminderStepSchemas[stepId as keyof typeof meetingReminderStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
