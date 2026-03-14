import { z } from 'zod';

export const purchaseOrderFormSchemaFields = {
  orderStatus: z.string().min(1, { message: 'Please select order status' }),
  paymentStatus: z.string().min(1, { message: 'Please select payment status' }),
  orderBaseAmount: z.string().optional(),
  shippingAmount: z.string().optional(),
  orderTaxRate: z.string().optional(),
  shippingMethod: z.string().optional(),
  customerId: z.string().optional(),
};

export const purchaseOrderFormSchema = z.object(purchaseOrderFormSchemaFields);

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;
