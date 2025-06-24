import { z } from 'zod';

/**
 * Zod validation schema for Meeting form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const meetingFormSchema = z.object({
  meetingDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  duration: z
    .string()
    .refine((val) => !val || Number(val) >= 15, { message: 'Must be at least 15' })
    .refine((val) => !val || Number(val) <= 480, { message: 'Must be at most 480' }),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  meetingUrl: z.string().max(500).optional(),
  googleCalendarEventId: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().max(50).optional(),
  meetingStatus: z.string(),
  meetingType: z.string(),
  createdAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  updatedAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  organizer: z.number(),
  assignedCustomer: z.number().optional(),
  call: z.number(),
});

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;

// Individual field schemas for granular validation
export const meetingFieldSchemas = {
  meetingDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  duration: z
    .string()
    .refine((val) => !val || Number(val) >= 15, { message: 'Must be at least 15' })
    .refine((val) => !val || Number(val) <= 480, { message: 'Must be at most 480' }),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  meetingUrl: z.string().max(500).optional(),
  googleCalendarEventId: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().max(50).optional(),
  meetingStatus: z.string(),
  meetingType: z.string(),
  createdAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  updatedAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  organizer: z.number(),
  assignedCustomer: z.number().optional(),
  call: z.number(),
};

// Step-specific validation schemas
export const meetingStepSchemas = {
  basic: z.object({
    title: meetingFieldSchemas.title,
    description: meetingFieldSchemas.description,
    meetingUrl: meetingFieldSchemas.meetingUrl,
    googleCalendarEventId: meetingFieldSchemas.googleCalendarEventId,
    notes: meetingFieldSchemas.notes,
    timeZone: meetingFieldSchemas.timeZone,
    meetingStatus: meetingFieldSchemas.meetingStatus,
    meetingType: meetingFieldSchemas.meetingType,
    duration: meetingFieldSchemas.duration,
  }),

  dates: z.object({
    meetingDateTime: meetingFieldSchemas.meetingDateTime,
    createdAt: meetingFieldSchemas.createdAt,
    updatedAt: meetingFieldSchemas.updatedAt,
  }),

  settings: z.object({
    isRecurring: meetingFieldSchemas.isRecurring,
  }),

  user: z.object({
    organizer: meetingFieldSchemas.organizer,
  }),
  business: z.object({
    assignedCustomer: meetingFieldSchemas.assignedCustomer,
  }),
  other: z.object({
    call: meetingFieldSchemas.call,
  }),

  review: meetingFormSchema,
};

// Validation helper functions
export const meetingValidationHelpers = {
  validateStep: (stepId: string, data: Partial<MeetingFormValues>) => {
    const stepSchema = meetingStepSchemas[stepId as keyof typeof meetingStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = meetingFieldSchemas[fieldName as keyof typeof meetingFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'meetingDateTime') {
      return {
        required: true,
      };
    }
    if (fieldName === 'duration') {
      return {
        required: true,
        min: 15,
        max: 480,
      };
    }
    if (fieldName === 'title') {
      return {
        required: true,
        minLength: 2,
        maxLength: 200,
      };
    }
    if (fieldName === 'description') {
      return {
        required: false,
        maxLength: 1000,
      };
    }
    if (fieldName === 'meetingUrl') {
      return {
        required: false,
        maxLength: 500,
      };
    }
    if (fieldName === 'googleCalendarEventId') {
      return {
        required: false,
        maxLength: 100,
      };
    }
    if (fieldName === 'notes') {
      return {
        required: false,
        maxLength: 2000,
      };
    }
    if (fieldName === 'timeZone') {
      return {
        required: false,
        maxLength: 50,
      };
    }
    if (fieldName === 'meetingStatus') {
      return {
        required: true,
      };
    }
    if (fieldName === 'meetingType') {
      return {
        required: true,
      };
    }

    return {};
  },
};
