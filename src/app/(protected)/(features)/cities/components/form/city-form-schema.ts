// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * City form validation schema with user-friendly messages
 */
import { z } from "zod";

export const cityFormSchemaFields = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  district: z.number({ message: "Please select district from the dropdown" }),
};

export const cityFormSchema = z.object(cityFormSchemaFields);

export type CityFormValues = z.infer<typeof cityFormSchema>;

// Individual field schemas for granular validation
export const cityFieldSchemas = {
  name: z.string({ message: "Please enter name" }).min(1, { message: "Please enter name" }).min(2, { message: "Please enter at least 2 characters" }).max(100, { message: "Please enter no more than 100 characters" }),
  district: z.number({ message: "Please select district from the dropdown" }),
};

// Step-specific validation schemas
export const cityStepSchemas = {
  basic: z.object({
    name: cityFieldSchemas.name,
    createdBy: cityFieldSchemas.createdBy,
    createdDate: cityFieldSchemas.createdDate,
    lastModifiedBy: cityFieldSchemas.lastModifiedBy,
    lastModifiedDate: cityFieldSchemas.lastModifiedDate,
  }),
  
  review: cityFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = cityStepSchemas[stepId as keyof typeof cityStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
