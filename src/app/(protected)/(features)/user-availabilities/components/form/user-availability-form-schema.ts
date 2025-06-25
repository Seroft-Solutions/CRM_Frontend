import { z } from "zod";

/**
 * Zod validation schema for UserAvailability form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const userAvailabilityFormSchema = z.object({
  dayOfWeek: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean(),
  effectiveFrom: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  effectiveTo: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  timeZone: z.string().max(50).optional(),
  user: z.number(),
});

export type UserAvailabilityFormValues = z.infer<typeof userAvailabilityFormSchema>;

// Individual field schemas for granular validation
export const userAvailabilityFieldSchemas = {
  dayOfWeek: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean(),
  effectiveFrom: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  effectiveTo: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }).optional(),
  timeZone: z.string().max(50).optional(),
  user: z.number(),
};

// Step-specific validation schemas
export const userAvailabilityStepSchemas = {
  basic: z.object({
    dayOfWeek: userAvailabilityFieldSchemas.dayOfWeek,
    startTime: userAvailabilityFieldSchemas.startTime,
    endTime: userAvailabilityFieldSchemas.endTime,
    timeZone: userAvailabilityFieldSchemas.timeZone,
  }),
  
  dates: z.object({
    effectiveFrom: userAvailabilityFieldSchemas.effectiveFrom,
    effectiveTo: userAvailabilityFieldSchemas.effectiveTo,
  }),
  
  settings: z.object({
    isAvailable: userAvailabilityFieldSchemas.isAvailable,
  }),
  
  user: z.object({
    user: userAvailabilityFieldSchemas.user,
  }),
  
  review: userAvailabilityFormSchema
};

// Validation helper functions
export const userAvailabilityValidationHelpers = {
  validateStep: (stepId: string, data: Partial<UserAvailabilityFormValues>) => {
    const stepSchema = userAvailabilityStepSchemas[stepId as keyof typeof userAvailabilityStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = userAvailabilityFieldSchemas[fieldName as keyof typeof userAvailabilityFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'dayOfWeek') {
      return {
        required: true,
      };
    }
    if (fieldName === 'startTime') {
      return {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      };
    }
    if (fieldName === 'endTime') {
      return {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      };
    }
    if (fieldName === 'isAvailable') {
      return {
        required: true,
      };
    }
    if (fieldName === 'timeZone') {
      return {
        required: false,
        maxLength: 50,
      };
    }
    
    return {};
  }
};
