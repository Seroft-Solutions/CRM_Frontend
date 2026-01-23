/**
 * ProductCatalog form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const productCatalogFormSchemaFields = {
  productCatalogName: z
    .string({ message: 'Please enter product catalog name' })
    .min(1, { message: 'Please enter product catalog name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  price: z
    .string({ message: 'Please enter price' })
    .min(1, { message: 'Please enter price' })
    .refine((val) => Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    }),
  description: z
    .string()
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
  image: z
    .string()
    .optional(),
  product: z.number({ message: 'Please select product from the dropdown' }),
  variants: z.array(z.number()).optional(),
};

export const productCatalogFormSchema = z.object(productCatalogFormSchemaFields);

export type ProductCatalogFormValues = z.infer<typeof productCatalogFormSchema>;

export const productCatalogFieldSchemas = {
  productCatalogName: z
    .string({ message: 'Please enter product catalog name' })
    .min(1, { message: 'Please enter product catalog name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  price: z
    .string({ message: 'Please enter price' })
    .min(1, { message: 'Please enter price' })
    .refine((val) => Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => Number(val) <= 999999, {
      message: 'Please enter a number 999999 or lower',
    }),
  description: z
    .string()
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
  image: z
    .string()
    .optional(),
  product: z.number({ message: 'Please select product from the dropdown' }),
  variants: z.array(z.number()).optional(),
};

export const productCatalogStepSchemas = {
  basic: z.object({
    productCatalogName: productCatalogFieldSchemas.productCatalogName,
    price: productCatalogFieldSchemas.price,
    description: productCatalogFieldSchemas.description,
    product: productCatalogFieldSchemas.product,
    variants: productCatalogFieldSchemas.variants,
  }),
  'variant-images': z.object({
    image: productCatalogFieldSchemas.image,
  }),
  review: productCatalogFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = productCatalogStepSchemas[stepId as keyof typeof productCatalogStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
