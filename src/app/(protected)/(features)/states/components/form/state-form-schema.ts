/**
 * State form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const stateFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  country: z
    .string({ message: 'Please enter country' })
    .min(1, { message: 'Please enter country' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const stateFormSchema = z.object(stateFormSchemaFields);

export type StateFormValues = z.infer<typeof stateFormSchema>;

export const stateFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  country: z
    .string({ message: 'Please enter country' })
    .min(1, { message: 'Please enter country' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const stateStepSchemas = {
  basic: z.object({
    name: stateFieldSchemas.name,
    country: stateFieldSchemas.country,
    status: stateFieldSchemas.status,
    createdBy: stateFieldSchemas.createdBy,
    createdDate: stateFieldSchemas.createdDate,
    lastModifiedBy: stateFieldSchemas.lastModifiedBy,
    lastModifiedDate: stateFieldSchemas.lastModifiedDate,
  }),

  review: stateFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = stateStepSchemas[stepId as keyof typeof stateStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
