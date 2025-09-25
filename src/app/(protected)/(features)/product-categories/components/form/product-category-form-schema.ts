// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * ProductCategory form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const productCategoryFormSchemaFields = {
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
};

export const productCategoryFormSchema = z.object(productCategoryFormSchemaFields);

export type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;

// Individual field schemas for granular validation
export const productCategoryFieldSchemas = {
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
};

// Step-specific validation schemas
export const productCategoryStepSchemas = {
  basic: z.object({
    name: productCategoryFieldSchemas.name,
    code: productCategoryFieldSchemas.code,
    description: productCategoryFieldSchemas.description,
    remark: productCategoryFieldSchemas.remark,
    status: productCategoryFieldSchemas.status,
    createdBy: productCategoryFieldSchemas.createdBy,
    createdDate: productCategoryFieldSchemas.createdDate,
    lastModifiedBy: productCategoryFieldSchemas.lastModifiedBy,
    lastModifiedDate: productCategoryFieldSchemas.lastModifiedDate,
  }),

  review: productCategoryFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = productCategoryStepSchemas[stepId as keyof typeof productCategoryStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
