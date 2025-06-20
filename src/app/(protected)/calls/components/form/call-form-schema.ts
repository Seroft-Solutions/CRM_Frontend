import { z } from "zod";

/**
 * Zod validation schema for Call form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const callFormSchema = z.object({
  callDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }),
  priority: z.number(),
  callType: z.number(),
  subCallType: z.number(),
  source: z.number(),
  channelType: z.number(),
  callCategory: z.number(),
  callStatus: z.number(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
  assignedTo: z.number().optional(),
  channelParty: z.number().optional(),
  party: z.number(),
});

export type CallFormValues = z.infer<typeof callFormSchema>;

// Individual field schemas for granular validation
export const callFieldSchemas = {
  callDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Invalid date format"
  }),
  priority: z.number(),
  callType: z.number(),
  subCallType: z.number(),
  source: z.number(),
  channelType: z.number(),
  callCategory: z.number(),
  callStatus: z.number(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
  assignedTo: z.number().optional(),
  channelParty: z.number().optional(),
  party: z.number(),
};

// Step-specific validation schemas
export const callStepSchemas = {
  
  dates: z.object({
    callDateTime: callFieldSchemas.callDateTime,
  }),
  
  
  geographic: z.object({
    state: callFieldSchemas.state,
    district: callFieldSchemas.district,
    city: callFieldSchemas.city,
    area: callFieldSchemas.area,
  }),
  user: z.object({
    assignedTo: callFieldSchemas.assignedTo,
    channelParty: callFieldSchemas.channelParty,
  }),
  classification: z.object({
    priority: callFieldSchemas.priority,
    callType: callFieldSchemas.callType,
    subCallType: callFieldSchemas.subCallType,
    channelType: callFieldSchemas.channelType,
    callCategory: callFieldSchemas.callCategory,
    callStatus: callFieldSchemas.callStatus,
  }),
  business: z.object({
    source: callFieldSchemas.source,
    party: callFieldSchemas.party,
  }),
  
  review: callFormSchema
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
  }
};
