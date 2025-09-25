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
import { z } from 'zod';

export const productFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  code: z
    .string({ message: 'Please enter code' })
    .min(1, { message: 'Please enter code' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(20, { message: 'Please enter no more than 20 characters' })
    .regex(/^[A-Za-z0-9_-]+$/, { message: 'Please enter valid code' }),
  description: z
    .string()
    .max(500, { message: 'Please enter no more than 500 characters' })
    .optional(),
  basePrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  minPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  maxPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string().optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
};

export const productFormSchema = z
    .object(productFormSchemaFields)
    .refine(
        (data) => {
          const minPrice = data.minPrice ? Number(data.minPrice) : null;
          const maxPrice = data.maxPrice ? Number(data.maxPrice) : null;

          // Only validate if both minPrice and maxPrice are provided
          if (minPrice !== null && maxPrice !== null) {
            return maxPrice > minPrice;
          }
          return true; // No validation if either is missing
        },
        {
          message: 'Max price must be greater than min price',
          path: ['maxPrice'], // This will highlight the maxPrice field in the form
        }
    );

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Individual field schemas for granular validation
export const productFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  code: z
    .string({ message: 'Please enter code' })
    .min(1, { message: 'Please enter code' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(20, { message: 'Please enter no more than 20 characters' })
    .regex(/^[A-Za-z0-9_-]+$/, { message: 'Please enter valid code' }),
  description: z
    .string()
    .max(500, { message: 'Please enter no more than 500 characters' })
    .optional(),
  basePrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  minPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  maxPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string().optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
};

// Step-specific validation schemas
export const productStepSchemas = {
  basic: z.object({
    name: productFieldSchemas.name,
    code: productFieldSchemas.code,
    description: productFieldSchemas.description,
    basePrice: productFieldSchemas.basePrice,
    minPrice: productFieldSchemas.minPrice,
    maxPrice: productFieldSchemas.maxPrice,
    remark: productFieldSchemas.remark,
    status: productFieldSchemas.status,
    createdBy: productFieldSchemas.createdBy,
    createdDate: productFieldSchemas.createdDate,
    lastModifiedBy: productFieldSchemas.lastModifiedBy,
    lastModifiedDate: productFieldSchemas.lastModifiedDate,
  }).refine(
      (data) => {
        const minPrice = data.minPrice ? Number(data.minPrice) : null;
        const maxPrice = data.maxPrice ? Number(data.maxPrice) : null;

        if (minPrice !== null && maxPrice !== null) {
          return maxPrice > minPrice;
        }
        return true;
      },
      {
        message: 'Max price must be greater than min price',
        path: ['maxPrice'],
      }
  ),

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
