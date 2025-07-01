/**
 * Meeting form validation schema with user-friendly messages
 */
import { z } from "zod";

export const meetingFormSchemaFields = {
  meetingDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  duration: z.string({ message: "Please enter duration" }).min(1, { message: "Please enter duration" }).refine(val => !val || Number(val) >= 15, { message: "Please enter a number 15 or higher" }).refine(val => !val || Number(val) <= 480, { message: "Please enter a number 480 or lower" }),
  title: z.string({ message: "Please enter title" }).min(1, { message: "Please enter title" }).min(2, { message: "Please enter at least 2 characters" }).max(200, { message: "Please enter no more than 200 characters" }),
  description: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
  meetingUrl: z.string().max(500, { message: "Please enter no more than 500 characters" }).optional(),
  googleCalendarEventId: z.string().max(100, { message: "Please enter no more than 100 characters" }).optional(),
  notes: z.string().max(2000, { message: "Please enter no more than 2000 characters" }).optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  meetingStatus: z.string({ message: "Please enter meetingstatus" }).min(1, { message: "Please enter meetingstatus" }),
  meetingType: z.string({ message: "Please enter meetingtype" }).min(1, { message: "Please enter meetingtype" }),
  createdAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  updatedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  organizer: z.number({ message: "Please select organizer from the dropdown" }),
  assignedCustomer: z.number().optional(),
  call: z.number().optional(),
};

export const meetingFormSchema = z.object(meetingFormSchemaFields);

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;

// Individual field schemas for granular validation
export const meetingFieldSchemas = {
  meetingDateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }),
  duration: z.string({ message: "Please enter duration" }).min(1, { message: "Please enter duration" }).refine(val => !val || Number(val) >= 15, { message: "Please enter a number 15 or higher" }).refine(val => !val || Number(val) <= 480, { message: "Please enter a number 480 or lower" }),
  title: z.string({ message: "Please enter title" }).min(1, { message: "Please enter title" }).min(2, { message: "Please enter at least 2 characters" }).max(200, { message: "Please enter no more than 200 characters" }),
  description: z.string().max(1000, { message: "Please enter no more than 1000 characters" }).optional(),
  meetingUrl: z.string().max(500, { message: "Please enter no more than 500 characters" }).optional(),
  googleCalendarEventId: z.string().max(100, { message: "Please enter no more than 100 characters" }).optional(),
  notes: z.string().max(2000, { message: "Please enter no more than 2000 characters" }).optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().max(50, { message: "Please enter no more than 50 characters" }).optional(),
  meetingStatus: z.string({ message: "Please enter meetingstatus" }).min(1, { message: "Please enter meetingstatus" }),
  meetingType: z.string({ message: "Please enter meetingtype" }).min(1, { message: "Please enter meetingtype" }),
  createdAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  updatedAt: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a valid date and time"
  }).optional(),
  organizer: z.number({ message: "Please select organizer from the dropdown" }),
  assignedCustomer: z.number().optional(),
  call: z.number().optional(),
};

// Step-specific validation schemas
export const meetingStepSchemas = {
  basic: z.object({
    meetingDateTime: meetingFieldSchemas.meetingDateTime,
    duration: meetingFieldSchemas.duration,
    title: meetingFieldSchemas.title,
    description: meetingFieldSchemas.description,
    meetingUrl: meetingFieldSchemas.meetingUrl,
    googleCalendarEventId: meetingFieldSchemas.googleCalendarEventId,
    notes: meetingFieldSchemas.notes,
    timeZone: meetingFieldSchemas.timeZone,
    meetingStatus: meetingFieldSchemas.meetingStatus,
    meetingType: meetingFieldSchemas.meetingType,
    createdAt: meetingFieldSchemas.createdAt,
    updatedAt: meetingFieldSchemas.updatedAt,
  }),
  
  review: meetingFormSchema,
};

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const schema = meetingStepSchemas[stepId as keyof typeof meetingStepSchemas];
  if (!schema) return { success: true, data };
  
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, error };
  }
};
