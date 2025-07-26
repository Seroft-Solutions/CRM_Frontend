// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
/**
 * UserAvailability form validation schema with user-friendly messages
 */
import { z } from "zod";

export const userAvailabilityFormSchemaFields = {
  dayOfWeek: z.string({ message: "Please enter dayofweek" }).min(1, { message: "Please enter dayofweek" }),
  startTime: z.string({ message: "Please enter starttime" }).min(1, { message: "Please enter starttime" }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter valid starttime" }),
  endTime: z.string({ message: "Please enter endtime" }).min(1, { message: "Please enter endtime" }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter valid endtime" }),
  isAvailable: z.boolean(),
  effectiveFrom: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  effectiveTo: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  timeZone: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  user: z.string().optional(),
};

export const userAvailabilityFormSchema = z.object(userAvailabilityFormSchemaFields);

export type UserAvailabilityFormValues = z.infer<typeof userAvailabilityFormSchema>;

// Individual field schemas for granular validation
export const userAvailabilityFieldSchemas = {
  dayOfWeek: z.string({ message: "Please enter dayofweek" }).min(1, { message: "Please enter dayofweek" }),
  startTime: z.string({ message: "Please enter starttime" }).min(1, { message: "Please enter starttime" }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter valid starttime" }),
  endTime: z.string({ message: "Please enter endtime" }).min(1, { message: "Please enter endtime" }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter valid endtime" }),
  isAvailable: z.boolean(),
  effectiveFrom: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  effectiveTo: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  timeZone: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  user: z.string().optional(),
};

// Step-specific validation schemas
export const userAvailabilityStepSchemas = {
  basic: z.object({
    dayOfWeek: userAvailabilityFieldSchemas.dayOfWeek,
    startTime: userAvailabilityFieldSchemas.startTime,
    endTime: userAvailabilityFieldSchemas.endTime,
    effectiveFrom: userAvailabilityFieldSchemas.effectiveFrom,
    effectiveTo: userAvailabilityFieldSchemas.effectiveTo,
    timeZone: userAvailabilityFieldSchemas.timeZone,
    createdBy: userAvailabilityFieldSchemas.createdBy,
    createdDate: userAvailabilityFieldSchemas.createdDate,
    lastModifiedBy: userAvailabilityFieldSchemas.lastModifiedBy,
    lastModifiedDate: userAvailabilityFieldSchemas.lastModifiedDate,
  }),
  
  review: userAvailabilityFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = userAvailabilityStepSchemas[stepId as keyof typeof userAvailabilityStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
