/**
 * Product form validation schema with user-friendly messages
 */
import { z } from 'zod';

const productImageFieldSchema = z.any().optional();

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
  articleNumber: z
    .string()
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
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
  discountedPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  salePrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
  variantConfig: z.number().optional(),
  variants: z.array(z.any()).optional(),
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
};

export const productFormSchemaBase = z.object(productFormSchemaFields);

export const productFormSchema = productFormSchemaBase.refine(
  (data) => {
    const discountedPrice = data.discountedPrice ? Number(data.discountedPrice) : null;
    const salePrice = data.salePrice ? Number(data.salePrice) : null;

    if (discountedPrice !== null && salePrice !== null) {
      return salePrice > discountedPrice;
    }

    return true;
  },
  {
    message: 'Sale price must be greater than discounted price',
    path: ['salePrice'],
  }
);

export type ProductFormValues = z.infer<typeof productFormSchema>;

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
  articleNumber: z
    .string()
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
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
  discountedPrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  salePrice: z
    .string()
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
  variantConfig: z.number().optional(),
  variants: z.array(z.any()).optional(),
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
};

/**
 * @deprecated Step schemas are no longer used in single-page form.
 * Use productFormSchema for full form validation instead.
 * Kept for backward compatibility with multi-step wizard if needed.
 */
export const productStepSchemas = {
  basic: z
    .object({
      name: productFieldSchemas.name,
      code: productFieldSchemas.code,
      articleNumber: productFieldSchemas.articleNumber,
      description: productFieldSchemas.description,
      basePrice: productFieldSchemas.basePrice,
      discountedPrice: productFieldSchemas.discountedPrice,
      salePrice: productFieldSchemas.salePrice,
      remark: productFieldSchemas.remark,
      category: productFieldSchemas.category,
      subCategory: productFieldSchemas.subCategory,
    })
    .refine(
      (data) => {
        const discountedPrice = data.discountedPrice ? Number(data.discountedPrice) : null;
        const salePrice = data.salePrice ? Number(data.salePrice) : null;

        if (discountedPrice !== null && salePrice !== null) {
          return salePrice > discountedPrice;
        }

        return true;
      },
      {
        message: 'Sale price must be greater than discounted price',
        path: ['salePrice'],
      }
    ),

  review: productFormSchema,
};

/**
 * @deprecated validateStep is no longer used in single-page form.
 * Use form.trigger() to validate the entire form instead.
 * Kept for backward compatibility with multi-step wizard if needed.
 */
export const validateStep = (stepId: string, data: unknown) => {
  const schema = productStepSchemas[stepId as keyof typeof productStepSchemas];

  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);

    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
