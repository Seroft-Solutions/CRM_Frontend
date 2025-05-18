import { z } from 'zod';

/**
 * Common validation schemas used throughout the application
 */
export const commonSchemas = {
  id: z.string().or(z.number()).nullable(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  date: z.date().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).transform((val) => new Date(val))).nullable().optional(),
  email: z.string().email('Invalid email address').nullable().optional(),
  phone: z.string().regex(/^[0-9+\-\s()]*$/, 'Invalid phone number').nullable().optional(),
  required: z.string().min(1, 'This field is required'),
  optionalText: z.string().nullable().optional(),
  optionalNumber: z.number().nullable().optional(),
  optionalBoolean: z.boolean().nullable().optional(),
  // Add more common schemas as needed
};

/**
 * Creates a schema for dependent fields
 * 
 * @param isRequired Whether the field is required when parent field has a value
 * @param message Custom error message
 * @returns A schema with conditional validation based on parent field
 */
export function createDependentFieldSchema(
  isRequired: boolean = false,
  message: string = 'This field is required when parent field has a value'
) {
  // If the field is not required, just return a nullable/optional schema
  if (!isRequired) {
    return z.string().nullable().optional();
  }
  
  // If required, we need to conditionally validate based on parent field
  return z.string().nullable().refine(
    (val, ctx) => {
      // If parent field exists (will be available in ctx.parent)
      const parentField = Object.values(ctx.parent)[0];
      
      // If parent has value, this field is required
      if (parentField && (parentField !== '' && parentField !== null)) {
        return val !== null && val !== '';
      }
      
      // Otherwise, it's optional
      return true;
    },
    {
      message,
    }
  );
}

// Add more validation utility functions as needed
