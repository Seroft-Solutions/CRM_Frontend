/**
 * ChannelType form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const channelTypeFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  commissionRate: z
    .string()
    .refine((val) => !val || val.length <= 3, { message: 'Please enter no more than 3 digits' })
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 100, { message: 'Please enter a number 100 or lower' })
    .optional(),
  status: z.string().optional(),
};

export const channelTypeFormSchema = z.object(channelTypeFormSchemaFields);

export type ChannelTypeFormValues = z.infer<typeof channelTypeFormSchema>;

export const channelTypeFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  commissionRate: z
    .string()
    .refine((val) => !val || val.length <= 3, { message: 'Please enter no more than 3 digits' })
    .refine((val) => !val || Number(val) >= 0, { message: 'Please enter a number 0 or higher' })
    .refine((val) => !val || Number(val) <= 100, { message: 'Please enter a number 100 or lower' })
    .optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  createdBy: z.string().optional(),
  createdDate: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedDate: z.string().optional(),
};

export const channelTypeStepSchemas = {
  basic: z.object({
    name: channelTypeFieldSchemas.name,
    description: channelTypeFieldSchemas.description,
    commissionRate: channelTypeFieldSchemas.commissionRate,
    status: channelTypeFieldSchemas.status,
    createdBy: channelTypeFieldSchemas.createdBy,
    createdDate: channelTypeFieldSchemas.createdDate,
    lastModifiedBy: channelTypeFieldSchemas.lastModifiedBy,
    lastModifiedDate: channelTypeFieldSchemas.lastModifiedDate,
  }),

  review: channelTypeFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = channelTypeStepSchemas[stepId as keyof typeof channelTypeStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
