import { z } from "zod";

/**
 * Zod validation schema for CallRemark form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callRemarkFormSchema = z.object({
  remark: z.string().max(2000),
  dateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }),
  call: z.number(),
});

export type CallRemarkFormValues = z.infer<typeof callRemarkFormSchema>;

// Individual field schemas for granular validation
export const callRemarkFieldSchemas = {
  remark: z.string().max(2000),
  dateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }),
  call: z.number(),
};

// Step-specific validation schemas
export const callRemarkStepSchemas = {
  basic: z.object({
    remark: callRemarkFieldSchemas.remark,
  }),
  
  dates: z.object({
    dateTime: callRemarkFieldSchemas.dateTime,
  }),
  
  
  other: z.object({
    call: callRemarkFieldSchemas.call,
  }),
  
  review: callRemarkFormSchema
};

// Validation helper functions
export const callRemarkValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CallRemarkFormValues>) => {
    const stepSchema = callRemarkStepSchemas[stepId as keyof typeof callRemarkStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = callRemarkFieldSchemas[fieldName as keyof typeof callRemarkFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'remark') {
      return {
        required: true,
        maxLength: 2000,
      };
    }
    if (fieldName === 'dateTime') {
      return {
        required: true,
      };
    }
    
    return {};
  }
};
