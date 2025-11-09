/**
 * Call form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const callFormSchemaFields = {
  leadNo: z.string().min(1, 'Lead number is required'),
  status: z.string().optional(),
  priority: z.number({ message: 'Please select priority from the dropdown' }),
  callType: z.number({ message: 'Please select call type from the dropdown' }),
  subCallType: z.number().optional(),
  source: z.number({ message: 'Please select source from the dropdown' }),
  customer: z.number({ message: 'Please select customer from the dropdown' }),
  product: z.number({ message: 'Please select product from the dropdown' }),
  channelType: z.number().optional(),
  channelParties: z.string().optional(),
  assignedTo: z.string().optional(),
  callStatus: z.number({ message: 'Please select call status from the dropdown' }),
};

export const callFormSchema = z.object(callFormSchemaFields);

export type CallFormValues = z.infer<typeof callFormSchema>;

export const callFieldSchemas = {
  leadNo: z.string().min(1, 'Lead number is required'),
  status: z.string().optional(),
  priority: z.number({ message: 'Please select priority from the dropdown' }),
  callType: z.number({ message: 'Please select call type from the dropdown' }),
  subCallType: z.number({ message: 'Please select sub call type from the dropdown' }),
  source: z.number({ message: 'Please select source from the dropdown' }),
  customer: z.number({ message: 'Please select customer from the dropdown' }),
  product: z.number({ message: 'Please select product from the dropdown' }),
  channelType: z.number().optional(),
  channelParties: z.string().optional(),
  assignedTo: z.string().optional(),
  callStatus: z.number({ message: 'Please select call status from the dropdown' }),
};

export const callStepSchemas = {
  review: callFormSchema,
};

export const validateStep = (stepId: string, data: any) => {
  const schema = callStepSchemas[stepId as keyof typeof callStepSchemas];
  if (!schema) return { success: true, data };

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
