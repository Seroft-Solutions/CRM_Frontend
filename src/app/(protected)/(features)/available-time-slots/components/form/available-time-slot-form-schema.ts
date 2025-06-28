import { z } from 'zod';

/**
 * Zod validation schema for AvailableTimeSlot form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const availableTimeSlotFormSchema = z.object({
  slotDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  duration: z
    .string()
    .refine((val) => !val || Number(val) >= 15, { message: 'Must be at least 15' })
    .refine((val) => !val || Number(val) <= 480, { message: 'Must be at most 480' }),
  isBooked: z.boolean().optional(),
  bookedAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  user: z.number(),
});

export type AvailableTimeSlotFormValues = z.infer<typeof availableTimeSlotFormSchema>;

// Individual field schemas for granular validation
export const availableTimeSlotFieldSchemas = {
  slotDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  duration: z
    .string()
    .refine((val) => !val || Number(val) >= 15, { message: 'Must be at least 15' })
    .refine((val) => !val || Number(val) <= 480, { message: 'Must be at most 480' }),
  isBooked: z.boolean().optional(),
  bookedAt: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .optional(),
  user: z.number(),
};

// Step-specific validation schemas
export const availableTimeSlotStepSchemas = {
  basic: z.object({
    duration: availableTimeSlotFieldSchemas.duration,
  }),

  dates: z.object({
    slotDateTime: availableTimeSlotFieldSchemas.slotDateTime,
    bookedAt: availableTimeSlotFieldSchemas.bookedAt,
  }),

  settings: z.object({
    isBooked: availableTimeSlotFieldSchemas.isBooked,
  }),

  user: z.object({
    user: availableTimeSlotFieldSchemas.user,
  }),

  review: availableTimeSlotFormSchema,
};

// Validation helper functions
export const availableTimeSlotValidationHelpers = {
  validateStep: (stepId: string, data: Partial<AvailableTimeSlotFormValues>) => {
    const stepSchema =
      availableTimeSlotStepSchemas[stepId as keyof typeof availableTimeSlotStepSchemas];
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
      availableTimeSlotFieldSchemas[fieldName as keyof typeof availableTimeSlotFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'slotDateTime') {
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

    return {};
  },
};
