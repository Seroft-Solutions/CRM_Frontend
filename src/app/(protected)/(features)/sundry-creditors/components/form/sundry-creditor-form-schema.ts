/**
 * Sundry Creditor form validation schema with user-friendly messages
 */
import { z } from 'zod';
import type { AreaDTO } from '@/core/api/generated/spring/schemas';

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
  status: z.string().optional(),
  area: z.custom<AreaDTO>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'name' in val;
    },
    {
      message: 'Please select a location',
    }
  ),
};

export const sundryCreditorFormSchema = z.object(sundryCreditorFormSchemaFields);

export type SundryCreditorFormValues = z.infer<typeof sundryCreditorFormSchema>;

export const sundryCreditorFieldSchemas = {
  creditorName: sundryCreditorFormSchemaFields.creditorName,
  email: sundryCreditorFormSchemaFields.email,
  mobile: sundryCreditorFormSchemaFields.mobile,
  whatsApp: sundryCreditorFormSchemaFields.whatsApp,
  contactPerson: sundryCreditorFormSchemaFields.contactPerson,
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  area: sundryCreditorFormSchemaFields.area,
};

export const sundryCreditorStepSchemas = {
  basic: z.object({
    creditorName: sundryCreditorFieldSchemas.creditorName,
    email: sundryCreditorFieldSchemas.email,
    mobile: sundryCreditorFieldSchemas.mobile,
    whatsApp: sundryCreditorFieldSchemas.whatsApp,
    contactPerson: sundryCreditorFieldSchemas.contactPerson,
    status: sundryCreditorFieldSchemas.status.optional(),
  }),
  geographic: z.object({
    area: sundryCreditorFieldSchemas.area,
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
