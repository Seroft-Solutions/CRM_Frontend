'use client';

import { useMemo } from 'react';
import {
  useGetAllOrderAddressDetails,
} from '@/core/api/generated/spring/endpoints/order-address-detail-resource/order-address-detail-resource.gen';
import {
  useGetAllOrderDetails,
} from '@/core/api/generated/spring/endpoints/order-detail-resource/order-detail-resource.gen';
import {
  useGetAllOrderHistories,
} from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { useGetOrder } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { useGetAllOrderDiscountDetails } from '@/core/api/order-discount-detail';
import { useGetAllOrderShippingDetails } from '@/core/api/order-shipping-detail';
import {
  mapOrderAddressDetail,
  mapOrderDiscountDetail,
  mapOrderDetails,
  mapOrderDtoToRecord,
  mapOrderHistoryEntries,
  mapOrderShippingDetail,
} from '../data/order-data';
import { OrderDetail } from './order-detail';

interface OrderDetailContainerProps {
  orderId: number;
}

export function OrderDetailContainer({ orderId }: OrderDetailContainerProps) {
  const isValidId = Number.isFinite(orderId) && orderId > 0;

  const orderQuery = useGetOrder(orderId, {
    query: {
      enabled: isValidId,
    },
  });

  const detailQuery = useGetAllOrderDetails(
    isValidId ? { 'orderId.equals': orderId, sort: ['id,asc'] } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const historyQuery = useGetAllOrderHistories(
    isValidId ? { 'orderId.equals': orderId, sort: ['createdDate,desc'] } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const addressQuery = useGetAllOrderAddressDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const shippingQuery = useGetAllOrderShippingDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const discountQuery = useGetAllOrderDiscountDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
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
    shippingQuery.isLoading ||
    discountQuery.isLoading;

  const orderRecord = useMemo(() => {
    if (!orderQuery.data) return undefined;
    const base = mapOrderDtoToRecord(orderQuery.data);

    return {
      ...base,
      items: mapOrderDetails(detailQuery.data),
      history: mapOrderHistoryEntries(historyQuery.data),
      address: mapOrderAddressDetail(addressQuery.data?.[0], orderQuery.data),
      shipping: mapOrderShippingDetail(shippingQuery.data?.[0], orderQuery.data),
      discount: mapOrderDiscountDetail(discountQuery.data?.[0], orderQuery.data),
    };
  }, [
    orderQuery.data,
    detailQuery.data,
    historyQuery.data,
    addressQuery.data,
    shippingQuery.data,
    discountQuery.data,
  ]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading order details...
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
        Unable to load this order right now. Please try again.
      </div>
    );
  }

  if (!orderRecord) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-muted-foreground">
        Order not found.
      </div>
    );
  }

  return <OrderDetail order={orderRecord} />;
}
