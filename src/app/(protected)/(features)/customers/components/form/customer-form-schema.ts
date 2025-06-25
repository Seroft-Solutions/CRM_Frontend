import { z } from "zod";

/**
 * Zod validation schema for Customer form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const customerFormSchema = z.object({
  customerBusinessName: z.string().min(2).max(100),
  email: z.string().max(254).regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// Individual field schemas for granular validation
export const customerFieldSchemas = {
  customerBusinessName: z.string().min(2).max(100),
  email: z.string().max(254).regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
};

// Step-specific validation schemas
export const customerStepSchemas = {
  basic: z.object({
    customerBusinessName: customerFieldSchemas.customerBusinessName,
    email: customerFieldSchemas.email,
    mobile: customerFieldSchemas.mobile,
    whatsApp: customerFieldSchemas.whatsApp,
    contactPerson: customerFieldSchemas.contactPerson,
  }),
  
  
  
  geographic: z.object({
    state: customerFieldSchemas.state,
    district: customerFieldSchemas.district,
    city: customerFieldSchemas.city,
    area: customerFieldSchemas.area,
  }),
  
  review: customerFormSchema
};

// Validation helper functions
export const customerValidationHelpers = {
  validateStep: (stepId: string, data: Partial<CustomerFormValues>) => {
    const stepSchema = customerStepSchemas[stepId as keyof typeof customerStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = customerFieldSchemas[fieldName as keyof typeof customerFieldSchemas];
    if (!fieldSchema) return { success: true, data: value, error: null };
    
    try {
      const validatedValue = fieldSchema.parse(value);
      return { success: true, data: validatedValue, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  getFieldValidationRules: (fieldName: string) => {
    if (fieldName === 'customerBusinessName') {
      return {
        required: true,
        minLength: 2,
        maxLength: 100,
      };
    }
    if (fieldName === 'email') {
      return {
        required: false,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      };
    }
    if (fieldName === 'mobile') {
      return {
        required: true,
        pattern: /^[+]?[0-9]{10,15}$/,
      };
    }
    if (fieldName === 'whatsApp') {
      return {
        required: false,
        pattern: /^[+]?[0-9]{10,15}$/,
      };
    }
    if (fieldName === 'contactPerson') {
      return {
        required: false,
        minLength: 2,
        maxLength: 100,
      };
    }
    
    return {};
  }
};
