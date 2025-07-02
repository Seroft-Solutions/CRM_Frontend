/**
 * District form validation schema with user-friendly messages
 */
import { z } from "zod";

export const districtFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  state: z.number({ message: "Please select state from the dropdown" }),
};

export const districtFormSchema = z.object(districtFormSchemaFields);

export type DistrictFormValues = z.infer<typeof districtFormSchema>;

// Individual field schemas for granular validation
export const districtFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  state: z.number({ message: "Please select state from the dropdown" }),
};

// Step-specific validation schemas
export const districtStepSchemas = {
  basic: z.object({
    name: districtFieldSchemas.name,
    createdBy: districtFieldSchemas.createdBy,
    createdDate: districtFieldSchemas.createdDate,
    lastModifiedBy: districtFieldSchemas.lastModifiedBy,
    lastModifiedDate: districtFieldSchemas.lastModifiedDate,
  }),
  
  review: districtFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = districtStepSchemas[stepId as keyof typeof districtStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
