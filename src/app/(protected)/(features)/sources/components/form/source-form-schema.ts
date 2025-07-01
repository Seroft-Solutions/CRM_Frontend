/**
 * Source form validation schema with user-friendly messages
 */
import { z } from "zod";

export const sourceFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

export const sourceFormSchema = z.object(sourceFormSchemaFields);

export type SourceFormValues = z.infer<typeof sourceFormSchema>;

// Individual field schemas for granular validation
export const sourceFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

// Step-specific validation schemas
export const sourceStepSchemas = {
  basic: z.object({
    name: sourceFieldSchemas.name,
    description: sourceFieldSchemas.description,
    remark: sourceFieldSchemas.remark,
  }),
  
  review: sourceFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = sourceStepSchemas[stepId as keyof typeof sourceStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
