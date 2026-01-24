/**
 * Customer form validation schema with user-friendly messages
 */
import { z } from 'zod';
const addressSchema = z.object({
  id: z.number().optional(),
  completeAddress: z.string().min(1, { message: 'Address is required' }).max(255, {
    message: 'Please enter no more than 255 characters',
  }),
  area: z.any().nullable().refine(val => val !== null, { message: 'Location is required' }),
  isDefault: z.boolean(),
});

export const customerFormSchemaFields = {
  customerBusinessName: z
    .string({ message: 'Please enter customerbusinessname' })
    .min(1, { message: 'Please enter customerbusinessname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  email: z
    .string()
    .max(254, { message: 'Please enter no more than 254 characters' })
    .transform((val) => (val === '' ? undefined : val))
    .pipe(
      z
        .string()
        .email({ message: 'Please enter a valid email address (example: name@company.com)' })
        .optional()
    )
    .optional(),
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
  addresses: z
    .array(addressSchema)
    .min(1, { message: 'At least one address is required' })
    .refine((addresses) => addresses.some((address) => address.isDefault), {
      message: 'Select a default address',
    })
    .refine((addresses) => addresses.filter((address) => address.isDefault).length === 1, {
      message: 'Select only one default address',
    }),
  status: z.string().optional(),
};

export const customerFormSchema = z.object(customerFormSchemaFields);

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerFieldSchemas = {
  customerBusinessName: z
    .string({ message: 'Please enter customerbusinessname' })
    .min(1, { message: 'Please enter customerbusinessname' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  email: z
    .string()
    .max(254, { message: 'Please enter no more than 254 characters' })
    .transform((val) => (val === '' ? undefined : val))
    .pipe(
      z
        .string()
        .email({ message: 'Please enter a valid email address (example: name@company.com)' })
        .optional()
    )
    .optional(),
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
  addresses: customerFormSchemaFields.addresses,
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const customerStepSchemas = {
  basic: z.object({
    customerBusinessName: customerFieldSchemas.customerBusinessName,
    email: customerFieldSchemas.email,
    mobile: customerFieldSchemas.mobile,
    whatsApp: customerFieldSchemas.whatsApp,
    contactPerson: customerFieldSchemas.contactPerson,
    addresses: customerFieldSchemas.addresses,
    status: customerFieldSchemas.status.optional(),
  }),
  review: customerFormSchema,
};

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
