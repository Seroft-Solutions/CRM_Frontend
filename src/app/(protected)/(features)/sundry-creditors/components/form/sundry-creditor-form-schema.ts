/**
 * Sundry Creditor form validation schema with user-friendly messages
 */
import { z } from 'zod';
const addressSchema = z.object({
  id: z.number().optional(),
  title: z
    .string()
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional()
    .or(z.literal('')),
  completeAddress: z.string().min(1, { message: 'Address is required' }).max(255, {
    message: 'Please enter no more than 255 characters',
  }),
  area: z.any().nullable().refine(val => val !== null, { message: 'Location is required' }),
  isDefault: z.boolean(),
});

export const sundryCreditorFormSchemaFields = {
  creditorName: z
    .string({ message: 'Please enter creditor name' })
    .min(1, { message: 'Please enter creditor name' })
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
  products: z.array(z.number()).optional(),
};

export const sundryCreditorFormSchema = z.object(sundryCreditorFormSchemaFields);

export type SundryCreditorFormValues = z.infer<typeof sundryCreditorFormSchema>;

export const sundryCreditorFieldSchemas = {
  creditorName: sundryCreditorFormSchemaFields.creditorName,
  email: sundryCreditorFormSchemaFields.email,
  mobile: sundryCreditorFormSchemaFields.mobile,
  whatsApp: sundryCreditorFormSchemaFields.whatsApp,
  contactPerson: sundryCreditorFormSchemaFields.contactPerson,
  addresses: sundryCreditorFormSchemaFields.addresses,
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  products: sundryCreditorFormSchemaFields.products,
};

export const sundryCreditorStepSchemas = {
  basic: z.object({
    creditorName: sundryCreditorFieldSchemas.creditorName,
    email: sundryCreditorFieldSchemas.email,
    mobile: sundryCreditorFieldSchemas.mobile,
    whatsApp: sundryCreditorFieldSchemas.whatsApp,
    contactPerson: sundryCreditorFieldSchemas.contactPerson,
    addresses: sundryCreditorFieldSchemas.addresses,
    status: sundryCreditorFieldSchemas.status.optional(),
    products: sundryCreditorFieldSchemas.products.optional(),
  }),
  review: sundryCreditorFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = sundryCreditorStepSchemas[stepId as keyof typeof sundryCreditorStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
