// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * Area form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const areaFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  pincode: z
    .string({ message: 'Please enter pincode' })
    .min(1, { message: 'Please enter pincode' })
    .min(6, { message: 'Please enter at least 6 characters' })
    .max(6, { message: 'Please enter no more than 6 characters' })
    .regex(/^[0-9]{6}$/, { message: 'Please enter valid pincode' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  city: z.number({ message: 'Please select city from the dropdown' }),
};

export const areaFormSchema = z.object(areaFormSchemaFields);

export type AreaFormValues = z.infer<typeof areaFormSchema>;

// Individual field schemas for granular validation
export const areaFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  pincode: z
    .string({ message: 'Please enter pincode' })
    .min(1, { message: 'Please enter pincode' })
    .min(6, { message: 'Please enter at least 6 characters' })
    .max(6, { message: 'Please enter no more than 6 characters' })
    .regex(/^[0-9]{6}$/, { message: 'Please enter valid pincode' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  city: z.number({ message: 'Please select city from the dropdown' }),
};

// Step-specific validation schemas
export const areaStepSchemas = {
  basic: z.object({
    name: areaFieldSchemas.name,
    pincode: areaFieldSchemas.pincode,
    status: areaFieldSchemas.status,
    createdBy: areaFieldSchemas.createdBy,
    createdDate: areaFieldSchemas.createdDate,
    lastModifiedBy: areaFieldSchemas.lastModifiedBy,
    lastModifiedDate: areaFieldSchemas.lastModifiedDate,
  }),

  review: areaFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = areaStepSchemas[stepId as keyof typeof areaStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
