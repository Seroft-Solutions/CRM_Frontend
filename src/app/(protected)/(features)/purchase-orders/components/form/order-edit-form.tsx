'use client';

import { usePurchaseOrderRecord } from '../../hooks';
import { OrderForm } from './order-form';

interface OrderEditFormProps {
  orderId: number;
}

export function OrderEditForm({ orderId }: OrderEditFormProps) {
  const { orderRecord, addressExists, shippingExists, isLoading, isError } =
    usePurchaseOrderRecord(orderId, { includeHistory: false });

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading purchase order...
      </div>
    );
  }

  if (isError || !orderRecord) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
        Unable to load this purchase order for editing.
      </div>
    );
  }

  return (
    <OrderForm
      initialOrder={orderRecord}
      addressExists={addressExists}
      shippingExists={shippingExists}
    />
  );
}
