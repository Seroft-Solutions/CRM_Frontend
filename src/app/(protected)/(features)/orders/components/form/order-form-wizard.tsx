'use client';

import { OrderFormProvider } from './order-form-provider';
import { OrderFormContent, type OrderFormProps } from './order-form-content';

export function OrderFormWizard(props: OrderFormProps) {
  return (
    <OrderFormProvider initialOrder={props.initialOrder} callId={props.callId}>
      <OrderFormContent {...props} />
    </OrderFormProvider>
  );
}
