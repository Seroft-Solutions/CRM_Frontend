import { z } from 'zod';

/**
 * Zod validation schema for Call form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callFormSchema = z.object({
  callDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  priority: z.number(),
  callType: z.number(),
  subCallType: z.number(),
  callCategory: z.number(),
  source: z.number(),
  customer: z.number(),
  channelType: z.number(),
  channelParties: z.number().optional(),
  assignedTo: z.number().optional(),
  callStatus: z.number(),
});

export type CallFormValues = z.infer<typeof callFormSchema>;

// Individual field schemas for granular validation
export const callFieldSchemas = {
  callDateTime: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
  priority: z.number(),
  callType: z.number(),
  subCallType: z.number(),
  callCategory: z.number(),
  source: z.number(),
  customer: z.number(),
  channelType: z.number(),
  channelParties: z.number().optional(),
  assignedTo: z.number().optional(),
  callStatus: z.number(),
};

// Step-specific validation schemas
export const callStepSchemas = {
  dates: z.object({
    callDateTime: callFieldSchemas.callDateTime,
  }),

  user: z.object({
    channelParties: callFieldSchemas.channelParties,
    assignedTo: callFieldSchemas.assignedTo,
  }),
  classification: z.object({
    priority: callFieldSchemas.priority,
    callType: callFieldSchemas.callType,
    subCallType: callFieldSchemas.subCallType,
    callCategory: callFieldSchemas.callCategory,
    channelType: callFieldSchemas.channelType,
    callStatus: callFieldSchemas.callStatus,
  }),
  business: z.object({
    source: callFieldSchemas.source,
    customer: callFieldSchemas.customer,
  }),

  review: callFormSchema,
};

// Validation helper functions
export const callValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CallFormValues>) => {
    const stepSchema = callStepSchemas[stepId as keyof typeof callStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };

    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  validateField: (fieldName: string, value: any) => {
    const fieldSchema = callFieldSchemas[fieldName as keyof typeof callFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };

    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },

  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'callDateTime') {
      return {
        required: true,
      };
    }

    return {};
  },
};
