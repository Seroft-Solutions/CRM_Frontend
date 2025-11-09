/**
 * UserDraft form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const userDraftFormSchemaFields = {
  keycloakUserId: z.string().optional(),
  type: z.string().max(50, { message: 'Please enter no more than 50 characters' }).optional(),
  jsonPayload: z
    .string({ message: 'Please enter jsonpayload' })
    .min(1, { message: 'Please enter jsonpayload' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const userDraftFormSchema = z.object(userDraftFormSchemaFields);

export type UserDraftFormValues = z.infer<typeof userDraftFormSchema>;

export const userDraftFieldSchemas = {
  keycloakUserId: z.string().optional(),
  type: z.string().max(50, { message: 'Please enter no more than 50 characters' }).optional(),
  jsonPayload: z
    .string({ message: 'Please enter jsonpayload' })
    .min(1, { message: 'Please enter jsonpayload' }),
  status: z.string({ message: 'Please enter status' }).min(1, { message: 'Please enter status' }),
};

export const userDraftStepSchemas = {
  basic: z.object({
    keycloakUserId: userDraftFieldSchemas.keycloakUserId,
    type: userDraftFieldSchemas.type,
    jsonPayload: userDraftFieldSchemas.jsonPayload,
    status: userDraftFieldSchemas.status,
    createdBy: userDraftFieldSchemas.createdBy,
    createdDate: userDraftFieldSchemas.createdDate,
    lastModifiedBy: userDraftFieldSchemas.lastModifiedBy,
    lastModifiedDate: userDraftFieldSchemas.lastModifiedDate,
  }),

  review: userDraftFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = userDraftStepSchemas[stepId as keyof typeof userDraftStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
