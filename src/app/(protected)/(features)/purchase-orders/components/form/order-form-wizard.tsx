'use client';

import { PurchaseOrderFormProvider } from './order-form-provider';
import { OrderFormContent, type OrderFormProps } from './order-form-content';

export function OrderFormWizard(props: OrderFormProps) {
  return (
    <PurchaseOrderFormProvider initialOrder={props.initialOrder}>
      <OrderFormContent {...props} />
    </PurchaseOrderFormProvider>
  );
}
