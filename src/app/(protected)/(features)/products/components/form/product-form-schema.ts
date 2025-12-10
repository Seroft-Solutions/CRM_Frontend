/**
 * Product form validation schema with user-friendly messages
 */
import { z } from 'zod';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const productImageFieldSchema = z.any().optional();

const productPropertySchema = z
  .object({
    id: z.number().optional(),
    name: z
      .string({ message: 'Please enter property name' })
      .trim()
      .min(1, { message: 'Please enter property name' })
      .max(100, { message: 'Please enter no more than 100 characters' }),
    values: z
      .array(
        z
          .string({ message: 'Please enter a value' })
          .trim()
          .min(1, { message: 'Please enter a value' })
          .max(255, { message: 'Please enter no more than 255 characters' })
      )
      .min(1, { message: 'Add at least one value' }),
  })
  .strict();

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
  articalNumber: z.string().max(100, { message: 'Please enter no more than 100 characters' }).optional(),
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
  status: z.string().optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
  properties: z.array(productPropertySchema).optional(),
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
  articalNumber: z.string().max(100, { message: 'Please enter no more than 100 characters' }).optional(),
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
  status: z.string().optional(),
  category: z.number().optional(),
  subCategory: z.number().optional(),
  frontImage: productImageFieldSchema,
  backImage: productImageFieldSchema,
  sideImage: productImageFieldSchema,
  properties: z.array(productPropertySchema).optional(),
};

export const productStepSchemas = {
  basic: z
    .object({
      name: productFieldSchemas.name,
      code: productFieldSchemas.code,
      articalNumber: productFieldSchemas.articalNumber,
      description: productFieldSchemas.description,
      basePrice: productFieldSchemas.basePrice,
      discountedPrice: productFieldSchemas.discountedPrice,
      salePrice: productFieldSchemas.salePrice,
      remark: productFieldSchemas.remark,
      status: productFieldSchemas.status,
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

  properties: z.object({
    properties: productFieldSchemas.properties,
  }),

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
