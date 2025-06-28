import { z } from 'zod';

/**
 * Zod validation schema for MeetingParticipant form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const meetingParticipantFormSchema = z.object({
  email: z
    .string()
    .max(254)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  name: z.string().max(100).optional(),
  isRequired: z.boolean().optional(),
  hasAccepted: z.boolean().optional(),
  hasDeclined: z.boolean().optional(),
  responseDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  meeting: z.number(),
});

export type MeetingParticipantFormValues = z.infer<typeof meetingParticipantFormSchema>;

// Individual field schemas for granular validation
export const meetingParticipantFieldSchemas = {
  email: z
    .string()
    .max(254)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  name: z.string().max(100).optional(),
  isRequired: z.boolean().optional(),
  hasAccepted: z.boolean().optional(),
  hasDeclined: z.boolean().optional(),
  responseDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  meeting: z.number(),
};

// Step-specific validation schemas
export const meetingParticipantStepSchemas = {
  basic: z.object({
    email: meetingParticipantFieldSchemas.email,
    name: meetingParticipantFieldSchemas.name,
  }),

  dates: z.object({
    responseDateTime: meetingParticipantFieldSchemas.responseDateTime,
  }),

  settings: z.object({
    isRequired: meetingParticipantFieldSchemas.isRequired,
    hasAccepted: meetingParticipantFieldSchemas.hasAccepted,
    hasDeclined: meetingParticipantFieldSchemas.hasDeclined,
  }),

  other: z.object({
    meeting: meetingParticipantFieldSchemas.meeting,
  }),

  review: meetingParticipantFormSchema,
};

// Validation helper functions
export const meetingParticipantValidationHelpers = {
  validateStep: (stepId: string, data: Partial<MeetingParticipantFormValues>) => {
    const stepSchema =
      meetingParticipantStepSchemas[stepId as keyof typeof meetingParticipantStepSchemas];
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
      meetingParticipantFieldSchemas[fieldName as keyof typeof meetingParticipantFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'email') {
      return {
        required: true,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      };
    }
    if (fieldName === 'name') {
      return {
        required: false,
        maxLength: 100,
      };
    }

    return {};
  },
};
