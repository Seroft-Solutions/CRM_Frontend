/**
 * ProductSubCategory form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const productSubCategoryFormSchemaFields = {
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
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string().optional(),
  category: z.number({ message: 'Please select category from the dropdown' }),
};

export const productSubCategoryFormSchema = z.object(productSubCategoryFormSchemaFields);

export type ProductSubCategoryFormValues = z.infer<typeof productSubCategoryFormSchema>;

export const productSubCategoryFieldSchemas = {
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
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  category: z.number({ message: 'Please select category from the dropdown' }),
};

export const productSubCategoryStepSchemas = {
  basic: z.object({
    name: productSubCategoryFieldSchemas.name,
    code: productSubCategoryFieldSchemas.code,
    description: productSubCategoryFieldSchemas.description,
    remark: productSubCategoryFieldSchemas.remark,
    status: productSubCategoryFieldSchemas.status,
    createdBy: productSubCategoryFieldSchemas.createdBy,
    createdDate: productSubCategoryFieldSchemas.createdDate,
    lastModifiedBy: productSubCategoryFieldSchemas.lastModifiedBy,
    lastModifiedDate: productSubCategoryFieldSchemas.lastModifiedDate,
  }),

  review: productSubCategoryFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema =
    productSubCategoryStepSchemas[stepId as keyof typeof productSubCategoryStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
