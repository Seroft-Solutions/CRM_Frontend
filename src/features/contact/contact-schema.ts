import { z } from 'zod';

export const contactDetails = {
  email: 'crmcup1@gmail.com',
  phoneDisplay: '+91 85718 22550',
  whatsappNumber: '918571822550',
} as const;

export const contactFormSchema = z.object({
  name: z
    .string({ message: 'Please enter your name' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(80, { message: 'Name must not exceed 80 characters' }),
  email: z
    .string({ message: 'Please enter your email address' })
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(120, { message: 'Email must not exceed 120 characters' }),
  phone: z
    .string()
    .trim()
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .trim()
    .max(120, { message: 'Company name must not exceed 120 characters' })
    .optional()
    .or(z.literal('')),
  preferredChannel: z.enum(['email', 'whatsapp']),
  message: z
    .string({ message: 'Please enter your message' })
    .trim()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(1500, { message: 'Message must not exceed 1500 characters' }),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
