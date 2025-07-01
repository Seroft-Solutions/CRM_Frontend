/**
 * AvailableTimeSlot form validation schema with user-friendly messages
 */
import { z } from "zod";

export const availableTimeSlotFormSchemaFields = {
  slotDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  duration: z.string({ message: "Please enter duration" }).min(1, { message: "Please enter duration" }).refine(val => !val || Number(val) >= 15, { message: "Please enter a number 15 or higher" }).refine(val => !val || Number(val) <= 480, { message: "Please enter a number 480 or lower" }),
  isBooked: z.boolean().optional(),
  bookedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  user: z.number({ message: "Please select user from the dropdown" }),
};

export const availableTimeSlotFormSchema = z.object(availableTimeSlotFormSchemaFields);

export type AvailableTimeSlotFormValues = z.infer<typeof availableTimeSlotFormSchema>;

// Individual field schemas for granular validation
export const availableTimeSlotFieldSchemas = {
  slotDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  duration: z.string({ message: "Please enter duration" }).min(1, { message: "Please enter duration" }).refine(val => !val || Number(val) >= 15, { message: "Please enter a number 15 or higher" }).refine(val => !val || Number(val) <= 480, { message: "Please enter a number 480 or lower" }),
  isBooked: z.boolean().optional(),
  bookedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  user: z.number({ message: "Please select user from the dropdown" }),
};

// Step-specific validation schemas
export const availableTimeSlotStepSchemas = {
  basic: z.object({
    slotDateTime: availableTimeSlotFieldSchemas.slotDateTime,
    duration: availableTimeSlotFieldSchemas.duration,
    bookedAt: availableTimeSlotFieldSchemas.bookedAt,
  }),
  
  review: availableTimeSlotFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = availableTimeSlotStepSchemas[stepId as keyof typeof availableTimeSlotStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
