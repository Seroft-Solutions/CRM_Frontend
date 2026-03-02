'use client';

import { useMemo, useEffect } from 'react';
import {
  useGetAllPurchaseOrderAddressDetails as useGetAllOrderAddressDetails,
} from '@/core/api/purchase-order-address-detail';
import {
  useGetAllPurchaseOrderDetails as useGetAllOrderDetails,
} from '@/core/api/purchase-order-detail';
import {
  useGetAllPurchaseOrderHistories as useGetAllOrderHistories,
} from '@/core/api/purchase-order-history';
import { useGetPurchaseOrder as useGetOrder } from '@/core/api/purchase-order';
import { useGetAllPurchaseOrderShippingDetails as useGetAllOrderShippingDetails } from '@/core/api/purchase-order-shipping-detail';
import {
  mapOrderAddressDetail,
  mapOrderDetails,
  mapOrderDtoToRecord,
  mapOrderHistoryEntries,
  mapOrderShippingDetail,
  OrderRecord,
} from '../data/purchase-order-data';
import { OrderDetail } from './order-detail';

interface OrderDetailContainerProps {
  orderId: number;
  onOrderLoaded?: (order: OrderRecord) => void;
}

export function OrderDetailContainer({ orderId, onOrderLoaded }: OrderDetailContainerProps) {
  const isValidId = Number.isFinite(orderId) && orderId > 0;

  const orderQuery = useGetOrder(orderId, {
    query: {
      enabled: isValidId,
    },
  });

  const detailQuery = useGetAllOrderDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId, sort: ['id,asc'] } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const historyQuery = useGetAllOrderHistories(
    isValidId ? { 'purchaseOrderId.equals': orderId, sort: ['createdDate,desc'] } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const addressQuery = useGetAllOrderAddressDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const shippingQuery = useGetAllOrderShippingDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const isLoading =
    orderQuery.isLoading ||
    detailQuery.isLoading ||
    historyQuery.isLoading ||
    addressQuery.isLoading ||
    shippingQuery.isLoading;

  const orderRecord = useMemo(() => {
    if (!orderQuery.data) return undefined;
    const base = mapOrderDtoToRecord(orderQuery.data);

    return {
      ...base,
      items: mapOrderDetails(detailQuery.data),
      history: mapOrderHistoryEntries(historyQuery.data),
      address: mapOrderAddressDetail(addressQuery.data?.[0], orderQuery.data),
      shipping: mapOrderShippingDetail(shippingQuery.data?.[0], orderQuery.data),
    };
  }, [
    orderQuery.data,
    detailQuery.data,
    historyQuery.data,
    addressQuery.data,
    shippingQuery.data,
  ]);

  useEffect(() => {
    if (orderRecord && onOrderLoaded) {
      onOrderLoaded(orderRecord);
    }
  }, [orderRecord, onOrderLoaded]);

  console.log('isLoading', isLoading);
  console.log('orderRecord', orderRecord);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading purchase order details...
      </div>
    );
  }

  if (orderQuery.isError) {
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
