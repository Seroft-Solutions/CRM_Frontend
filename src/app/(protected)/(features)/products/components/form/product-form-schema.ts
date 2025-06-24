import { z } from "zod";

/**
 * Zod validation schema for Product form
 * This file is auto-generated. To modify validation rules, update the generator templates.
 */
export const productFormSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  remark: z.string().max(1000).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Individual field schemas for granular validation
export const productFieldSchemas = {
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  remark: z.string().max(1000).optional(),
};

// Step-specific validation schemas
export const productStepSchemas = {
  basic: z.object({
    name: productFieldSchemas.name,
    code: productFieldSchemas.code,
    description: productFieldSchemas.description,
    category: productFieldSchemas.category,
    remark: productFieldSchemas.remark,
    basePrice: productFieldSchemas.basePrice,
    minPrice: productFieldSchemas.minPrice,
    maxPrice: productFieldSchemas.maxPrice,
  }),
  
  
  
  
  review: productFormSchema
};

// Validation helper functions
export const productValidationHelpers = {
  validateStep: (stepId: string, data: Partial<ProductFormValues>) => {
    const stepSchema = productStepSchemas[stepId as keyof typeof productStepSchemas];
    if (!stepSchema) return { success: true, data, error: null };
    
    try {
      const validatedData = stepSchema.parse(data);
      return { success: true, data: validatedData, error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  },
  
  validateField: (fieldName: string, value: any) => {
    const fieldSchema = productFieldSchemas[fieldName as keyof typeof productFieldSchemas];
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
    if (fieldName === 'code') {
      return {
        required: true,
        minLength: 2,
        maxLength: 20,
        pattern: /^[A-Za-z0-9_-]+$/,
      };
    }
    if (fieldName === 'description') {
      return {
        required: false,
        maxLength: 500,
      };
    }
    if (fieldName === 'category') {
      return {
        required: false,
        maxLength: 50,
      };
    }
    if (fieldName === 'basePrice') {
      return {
        required: false,
        min: 0,
        max: 999999,
      };
    }
    if (fieldName === 'minPrice') {
      return {
        required: false,
        min: 0,
        max: 999999,
      };
    }
    if (fieldName === 'maxPrice') {
      return {
        required: false,
        min: 0,
        max: 999999,
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
