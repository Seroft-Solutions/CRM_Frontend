/**
 * Call form validation schema with user-friendly messages
 */
import { z } from "zod";

export const callFormSchemaFields = {
  callDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  priority: z.number({ message: "Please select priority from the dropdown" }),
  callType: z.number({ message: "Please select call type from the dropdown" }),
  subCallType: z.number({ message: "Please select sub call type from the dropdown" }),
  callCategory: z.number({ message: "Please select call category from the dropdown" }),
  source: z.number({ message: "Please select source from the dropdown" }),
  customer: z.number({ message: "Please select customer from the dropdown" }),
  channelType: z.number({ message: "Please select channel type from the dropdown" }),
  channelParties: z.number().optional(),
  assignedTo: z.number().optional(),
  callStatus: z.number({ message: "Please select call status from the dropdown" }),
};

export const callFormSchema = z.object(callFormSchemaFields);

export type CallFormValues = z.infer<typeof callFormSchema>;

// Individual field schemas for granular validation
export const callFieldSchemas = {
  callDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  priority: z.number({ message: "Please select priority from the dropdown" }),
  callType: z.number({ message: "Please select call type from the dropdown" }),
  subCallType: z.number({ message: "Please select sub call type from the dropdown" }),
  callCategory: z.number({ message: "Please select call category from the dropdown" }),
  source: z.number({ message: "Please select source from the dropdown" }),
  customer: z.number({ message: "Please select customer from the dropdown" }),
  channelType: z.number({ message: "Please select channel type from the dropdown" }),
  channelParties: z.number().optional(),
  assignedTo: z.number().optional(),
  callStatus: z.number({ message: "Please select call status from the dropdown" }),
};

// Step-specific validation schemas
export const callStepSchemas = {
  basic: z.object({
    callDateTime: callFieldSchemas.callDateTime,
  }),
  
  review: callFormSchema,
};

// Validation helpers
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
