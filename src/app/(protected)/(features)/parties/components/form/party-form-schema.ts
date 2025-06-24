import { z } from "zod";

/**
 * Zod validation schema for Party form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const partyFormSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  email: z.string().max(254).regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  address3: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;

// Individual field schemas for granular validation
export const partyFieldSchemas = {
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  email: z.string().max(254).regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  address3: z.string().max(255).optional(),
  remark: z.string().max(1000).optional(),
  state: z.number(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
};

// Step-specific validation schemas
export const partyStepSchemas = {
  basic: z.object({
    name: partyFieldSchemas.name,
    mobile: partyFieldSchemas.mobile,
    email: partyFieldSchemas.email,
    whatsApp: partyFieldSchemas.whatsApp,
    contactPerson: partyFieldSchemas.contactPerson,
    address1: partyFieldSchemas.address1,
    address2: partyFieldSchemas.address2,
    address3: partyFieldSchemas.address3,
    remark: partyFieldSchemas.remark,
  }),
  
  
  
  geographic: z.object({
    state: partyFieldSchemas.state,
    district: partyFieldSchemas.district,
    city: partyFieldSchemas.city,
    area: partyFieldSchemas.area,
  }),
  
  review: partyFormSchema
};

// Validation helper functions
export const partyValidationHelpers = {
  validateStep: (stepId: string, data: Partial<PartyFormValues>) => {
    const stepSchema = partyStepSchemas[stepId as keyof typeof partyStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = partyFieldSchemas[fieldName as keyof typeof partyFieldSchemas];
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
        maxLength: 100,
      };
    }
    if (fieldName === 'mobile') {
      return {
        required: true,
        pattern: /^[+]?[0-9]{10,15}$/,
      };
    }
    if (fieldName === 'email') {
      return {
        required: false,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
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
    if (fieldName === 'address1') {
      return {
        required: false,
        maxLength: 255,
      };
    }
    if (fieldName === 'address2') {
      return {
        required: false,
        maxLength: 255,
      };
    }
    if (fieldName === 'address3') {
      return {
        required: false,
        maxLength: 255,
      };
    }
    if (fieldName === 'remark') {
      return {
        required: false,
        maxLength: 1000,
      };
    }
    
    return {};
  }
};
