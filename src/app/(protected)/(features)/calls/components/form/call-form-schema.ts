// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * Call form validation schema with user-friendly messages
 */
import { z } from 'zod';

export const callFormSchemaFields = {
  leadNo: z
    .string()
    .min(1, 'Lead number is required')
    .regex(/^[A-Z]{3}\d{5}$/, 'Lead number must follow format: ABC12345 (3 letters + 5 digits)'),
  status: z.string().optional(), // Status is now auto-set to 'ACTIVE', so make it optional
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

// Individual field schemas for granular validation
export const callFieldSchemas = {
  leadNo: z
    .string()
    .min(1, 'Lead number is required')
    .regex(/^[A-Z]{3}\d{5}$/, 'Lead number must follow format: ABC12345 (3 letters + 5 digits)'),
  status: z.string().optional(), // Status is now auto-set to 'ACTIVE', so make it optional
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

// Step-specific validation schemas
export const callStepSchemas = {
  // Basic step removed since status is now auto-set to 'ACTIVE'
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
