/**
 * CallCategory form validation schema with user-friendly messages
 */
import { z } from "zod";

export const callCategoryFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

export const callCategoryFormSchema = z.object(callCategoryFormSchemaFields);

export type CallCategoryFormValues = z.infer<typeof callCategoryFormSchema>;

// Individual field schemas for granular validation
export const callCategoryFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

// Step-specific validation schemas
export const callCategoryStepSchemas = {
  basic: z.object({
    name: callCategoryFieldSchemas.name,
    description: callCategoryFieldSchemas.description,
    remark: callCategoryFieldSchemas.remark,
    createdBy: callCategoryFieldSchemas.createdBy,
    createdDate: callCategoryFieldSchemas.createdDate,
    lastModifiedBy: callCategoryFieldSchemas.lastModifiedBy,
    lastModifiedDate: callCategoryFieldSchemas.lastModifiedDate,
  }),
  
  review: callCategoryFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = callCategoryStepSchemas[stepId as keyof typeof callCategoryStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
