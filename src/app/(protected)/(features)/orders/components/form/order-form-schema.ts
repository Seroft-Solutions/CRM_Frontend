import { z } from 'zod';

export const orderFormSchemaFields = {
  orderStatus: z.string().min(1, { message: 'Please select order status' }),
  paymentStatus: z.string().min(1, { message: 'Please select payment status' }),
  orderBaseAmount: z.string().optional(),
  shippingAmount: z.string().optional(),
  orderTaxRate: z.string().optional(),
  discountCode: z.string().max(20, { message: 'Please enter no more than 20 characters' }).optional(),
  shippingMethod: z.string().optional(),
  customerId: z.string().optional(),
};

export const orderFormSchema = z.object(orderFormSchemaFields);

export type OrderFormValues = z.infer<typeof orderFormSchema>;
