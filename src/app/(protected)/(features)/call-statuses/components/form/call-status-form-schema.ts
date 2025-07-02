/**
 * CallStatus form validation schema with user-friendly messages
 */
import { z } from "zod";

export const callStatusFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

export const callStatusFormSchema = z.object(callStatusFormSchemaFields);

export type CallStatusFormValues = z.infer<typeof callStatusFormSchema>;

// Individual field schemas for granular validation
export const callStatusFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(50, { message: "Please enter no more than 50 characters" }),
  description: z.string().max(255, { message: "Please enter no more than 255 characters" }).optional(),
  remark: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
};

// Step-specific validation schemas
export const callStatusStepSchemas = {
  basic: z.object({
    name: callStatusFieldSchemas.name,
    description: callStatusFieldSchemas.description,
    remark: callStatusFieldSchemas.remark,
    createdBy: callStatusFieldSchemas.createdBy,
    createdDate: callStatusFieldSchemas.createdDate,
    lastModifiedBy: callStatusFieldSchemas.lastModifiedBy,
    lastModifiedDate: callStatusFieldSchemas.lastModifiedDate,
  }),
  
  review: callStatusFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = callStatusStepSchemas[stepId as keyof typeof callStatusStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
