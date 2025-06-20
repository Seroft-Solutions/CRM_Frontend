import { z } from "zod";

/**
 * Zod validation schema for ChannelType form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const channelTypeFormSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  commissionRate: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 100, { message: "Must be at most 100" }).optional(),
});

export type ChannelTypeFormValues = z.infer<typeof channelTypeFormSchema>;

// Individual field schemas for granular validation
export const channelTypeFieldSchemas = {
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  commissionRate: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 100, { message: "Must be at most 100" }).optional(),
};

// Step-specific validation schemas
export const channelTypeStepSchemas = {
  basic: z.object({
    name: channelTypeFieldSchemas.name,
    description: channelTypeFieldSchemas.description,
    commissionRate: channelTypeFieldSchemas.commissionRate,
  }),
  
  
  
  
  review: channelTypeFormSchema
};

// Validation helper functions
export const channelTypeValidationHelpers = {
  validateStep: (stepId: string, data: Partial<ChannelTypeFormValues>) => {
    const stepSchema = channelTypeStepSchemas[stepId as keyof typeof channelTypeStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = channelTypeFieldSchemas[fieldName as keyof typeof channelTypeFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'name') {
      return {
        required: true,
        minLength: 2,
        maxLength: 50,
      };
    }
    if (fieldName === 'description') {
      return {
        required: false,
        maxLength: 255,
      };
    }
    if (fieldName === 'commissionRate') {
      return {
        required: false,
        min: 0,
        max: 100,
      };
    }
    
    return {};
  }
};
