'use client';

import { OrderFormWizard } from './order-form-wizard';
import type { OrderFormProps } from './order-form-content';

export function OrderForm(props: OrderFormProps) {
  return <OrderFormWizard {...props} />;
}

export type { OrderFormProps } from './order-form-content';
