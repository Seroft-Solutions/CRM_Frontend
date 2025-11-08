/**
 * SubCallType form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const subCallTypeFormSchemaFields = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string().optional(),
  callType: z.number({ message: 'Please select call type from the dropdown' }),
};

export const subCallTypeFormSchema = z.object(subCallTypeFormSchemaFields);

export type SubCallTypeFormValues = z.infer<typeof subCallTypeFormSchema>;

export const subCallTypeFieldSchemas = {
  name: z
    .string({ message: 'Please enter name' })
    .min(1, { message: 'Please enter name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(50, { message: 'Please enter no more than 50 characters' }),
  description: z
    .string()
    .max(255, { message: 'Please enter no more than 255 characters' })
    .optional(),
  remark: z.string().max(1000, { message: 'Please enter no more than 1000 characters' }).optional(),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
  callType: z.number({ message: 'Please select call type from the dropdown' }),
};

export const subCallTypeStepSchemas = {
  basic: z.object({
    name: subCallTypeFieldSchemas.name,
    description: subCallTypeFieldSchemas.description,
    remark: subCallTypeFieldSchemas.remark,
    status: subCallTypeFieldSchemas.status,
    createdBy: subCallTypeFieldSchemas.createdBy,
    createdDate: subCallTypeFieldSchemas.createdDate,
    lastModifiedBy: subCallTypeFieldSchemas.lastModifiedBy,
    lastModifiedDate: subCallTypeFieldSchemas.lastModifiedDate,
  }),

  review: subCallTypeFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = subCallTypeStepSchemas[stepId as keyof typeof subCallTypeStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
