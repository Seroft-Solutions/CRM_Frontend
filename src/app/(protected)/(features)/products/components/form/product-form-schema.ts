// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * Product form validation schema with user-friendly messages
 */
import { z } from "zod";

export const productFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  code: z.string({ message: "Please enter code" }).min(1, { message: "Please enter code" }).min(2, { message: "Please enter at least 2 characters" }).max(20, { message: "Please enter no more than 20 characters" }).regex(/^[A-Za-z0-9_-]+$/, { message: "Please enter valid code" }),
  description: z.string().max(500, { message: "Please enter no more than 500 characters" }).optional(),
  category: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

export const productFormSchema = z.object(productFormSchemaFields);

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Individual field schemas for granular validation
export const productFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  code: z.string({ message: "Please enter code" }).min(1, { message: "Please enter code" }).min(2, { message: "Please enter at least 2 characters" }).max(20, { message: "Please enter no more than 20 characters" }).regex(/^[A-Za-z0-9_-]+$/, { message: "Please enter valid code" }),
  description: z.string().max(500, { message: "Please enter no more than 500 characters" }).optional(),
  category: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Please enter a number 0 or higher" }).refine(val => !val || Number(val) <= 999999, { message: "Please enter a number 999999 or lower" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

// Step-specific validation schemas
export const productStepSchemas = {
  basic: z.object({
    name: productFieldSchemas.name,
    code: productFieldSchemas.code,
    description: productFieldSchemas.description,
    category: productFieldSchemas.category,
    basePrice: productFieldSchemas.basePrice,
    minPrice: productFieldSchemas.minPrice,
    maxPrice: productFieldSchemas.maxPrice,
    remark: productFieldSchemas.remark,
    createdBy: productFieldSchemas.createdBy,
    createdDate: productFieldSchemas.createdDate,
    lastModifiedBy: productFieldSchemas.lastModifiedBy,
    lastModifiedDate: productFieldSchemas.lastModifiedDate,
  }),
  
  review: productFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = productStepSchemas[stepId as keyof typeof productStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
