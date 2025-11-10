/**
 * Product form validation schema with user-friendly messages
 */
import { z } from 'zod';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
};

export const productFormSchemaBase = z.object(productFormSchemaFields);

export const productFormSchema = productFormSchemaBase.refine(
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
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
};

export const productStepSchemas = {
  basic: z
    .object({
      name: productFieldSchemas.name,
      code: productFieldSchemas.code,
      description: productFieldSchemas.description,
      basePrice: productFieldSchemas.basePrice,
      minPrice: productFieldSchemas.minPrice,
      maxPrice: productFieldSchemas.maxPrice,
      remark: productFieldSchemas.remark,
      status: productFieldSchemas.status,
      category: productFieldSchemas.category,
      subCategory: productFieldSchemas.subCategory,
    })
    .refine(
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
