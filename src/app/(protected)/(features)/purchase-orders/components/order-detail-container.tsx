'use client';

import { useEffect } from 'react';
import type { OrderRecord } from '../data/purchase-order-data';
import { usePurchaseOrderRecord } from '../hooks';
import { OrderDetail } from './order-detail';

interface OrderDetailContainerProps {
  orderId: number;
  onOrderLoaded?: (order: OrderRecord) => void;
}

export function OrderDetailContainer({ orderId, onOrderLoaded }: OrderDetailContainerProps) {
  const { orderRecord, isLoading, isError } = usePurchaseOrderRecord(orderId, {
    includeHistory: true,
  });

  useEffect(() => {
    if (orderRecord && onOrderLoaded) {
      onOrderLoaded(orderRecord);
    }
  }, [orderRecord, onOrderLoaded]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading purchase order details...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
        Unable to load this purchase order right now. Please try again.
      </div>
    );
  }

  if (!orderRecord) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-muted-foreground">
        Purchase Order not found.
      </div>
    );
  }

  return <OrderDetail order={orderRecord} />;
}
