/**
 * Customer form validation schema with user-friendly messages
 */
import { z } from 'zod';
import type { AreaDTO } from '@/core/api/generated/spring/schemas';

export const customerFormSchemaFields = {
  customerBusinessName: z
    .string({ message: 'Please enter customerbusinessname' })
    .min(1, { message: 'Please enter customerbusinessname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  email: z
      .string()
      .max(254, { message: 'Please enter no more than 254 characters' })
      .transform((val) => (val === '' ? undefined : val)) // Treat empty string as unset
      .pipe(
          z
              .string()
              .email({ message: 'Please enter a valid email address (example: name@company.com)' })
              .optional() // Now optional after transform
      )
      .optional(), // Top-level optional for omission/undefined/null
  mobile: z
    .string({ message: 'Please enter mobile' })
    .min(1, { message: 'Please enter mobile' })
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message:
        'Please enter a valid phone number (10-15 digits only). Example: 03001234567 or +923001234567',
    }),
  whatsApp: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, { message: 'Please enter valid whatsapp' })
    .optional(),
  contactPerson: z
    .string()
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
  status: z.string().optional(),
  area: z.custom<AreaDTO>((val) => {
    return val && typeof val === 'object' && 'id' in val && 'name' in val;
  }, {
    message: 'Please select a location',
  }),
};

export const customerFormSchema = z.object(customerFormSchemaFields);

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// Individual field schemas for granular validation
export const customerFieldSchemas = {
  customerBusinessName: z
    .string({ message: 'Please enter customerbusinessname' })
    .min(1, { message: 'Please enter customerbusinessname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  email: z
      .string()
      .max(254, { message: 'Please enter no more than 254 characters' })
      .transform((val) => (val === '' ? undefined : val)) // Treat empty string as unset
      .pipe(
          z
              .string()
              .email({ message: 'Please enter a valid email address (example: name@company.com)' })
              .optional() // Now optional after transform
      )
      .optional(), // Top-level optional for omission/undefined/null
  mobile: z
    .string({ message: 'Please enter mobile' })
    .min(1, { message: 'Please enter mobile' })
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message:
        'Please enter a valid phone number (10-15 digits only). Example: 03001234567 or +923001234567',
    }),
  whatsApp: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, { message: 'Please enter valid whatsapp' })
    .optional(),
  contactPerson: z
    .string()
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  area: z.custom<AreaDTO>((val) => {
    return val && typeof val === 'object' && 'id' in val && 'name' in val;
  }, {
    message: 'Please select a location',
  }),
};

// Step-specific validation schemas
export const customerStepSchemas = {
  basic: z.object({
    customerBusinessName: customerFieldSchemas.customerBusinessName,
    email: customerFieldSchemas.email,
    mobile: customerFieldSchemas.mobile,
    whatsApp: customerFieldSchemas.whatsApp,
    contactPerson: customerFieldSchemas.contactPerson,
    status: customerFieldSchemas.status.optional(),
  }),
  geographic: z.object({
    area: customerFieldSchemas.area,
  }),
  review: customerFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = customerStepSchemas[stepId as keyof typeof customerStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
