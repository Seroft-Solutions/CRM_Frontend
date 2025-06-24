import { z } from 'zod';

/**
 * Zod validation schema for MeetingReminder form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const meetingReminderFormSchema = z.object({
  reminderType: z.string(),
  reminderMinutesBefore: z
    .string()
    .refine((val) => !val || Number(val) >= 5, { message: 'Must be at least 5' })
    .refine((val) => !val || Number(val) <= 43200, { message: 'Must be at most 43200' }),
  isTriggered: z.boolean().optional(),
  triggeredAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  failureReason: z.string().max(500).optional(),
  meeting: z.number(),
});

export type MeetingReminderFormValues = z.infer<typeof meetingReminderFormSchema>;

// Individual field schemas for granular validation
export const meetingReminderFieldSchemas = {
  reminderType: z.string(),
  reminderMinutesBefore: z
    .string()
    .refine((val) => !val || Number(val) >= 5, { message: 'Must be at least 5' })
    .refine((val) => !val || Number(val) <= 43200, { message: 'Must be at most 43200' }),
  isTriggered: z.boolean().optional(),
  triggeredAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  failureReason: z.string().max(500).optional(),
  meeting: z.number(),
};

// Step-specific validation schemas
export const meetingReminderStepSchemas = {
  basic: z.object({
    reminderType: meetingReminderFieldSchemas.reminderType,
    failureReason: meetingReminderFieldSchemas.failureReason,
    reminderMinutesBefore: meetingReminderFieldSchemas.reminderMinutesBefore,
  }),

  dates: z.object({
    triggeredAt: meetingReminderFieldSchemas.triggeredAt,
  }),

  settings: z.object({
    isTriggered: meetingReminderFieldSchemas.isTriggered,
  }),

  other: z.object({
    meeting: meetingReminderFieldSchemas.meeting,
  }),

  review: meetingReminderFormSchema,
};

// Validation helper functions
export const meetingReminderValidationHelpers = {
  validateStep: (stepId: string, data: Partial<MeetingReminderFormValues>) => {
    const stepSchema =
      meetingReminderStepSchemas[stepId as keyof typeof meetingReminderStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema =
      meetingReminderFieldSchemas[fieldName as keyof typeof meetingReminderFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'reminderType') {
      return {
        required: true,
      };
    }
    if (fieldName === 'reminderMinutesBefore') {
      return {
        required: true,
        min: 5,
        max: 43200,
      };
    }
    if (fieldName === 'failureReason') {
      return {
        required: false,
        maxLength: 500,
      };
    }

    return {};
  },
};
