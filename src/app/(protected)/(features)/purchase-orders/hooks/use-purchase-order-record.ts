'use client';

import { useMemo } from 'react';
import { useGetAllPurchaseOrderAddressDetails } from '@/core/api/purchase-order-address-detail';
import { useGetAllPurchaseOrderDetails } from '@/core/api/purchase-order-detail';
import { useGetAllPurchaseOrderHistories } from '@/core/api/purchase-order-history';
import { useGetPurchaseOrder } from '@/core/api/purchase-order';
import { useGetAllPurchaseOrderShippingDetails } from '@/core/api/purchase-order-shipping-detail';
import {
  mapOrderAddressDetail,
  mapOrderDetails,
  mapOrderDtoToRecord,
  mapOrderHistoryEntries,
  mapOrderShippingDetail,
} from '../data/purchase-order-data';

interface UsePurchaseOrderRecordOptions {
  includeHistory?: boolean;
}

export function usePurchaseOrderRecord(
  orderId: number,
  options: UsePurchaseOrderRecordOptions = {}
) {
  const { includeHistory = true } = options;
  const isValidId = Number.isFinite(orderId) && orderId > 0;

  const orderQuery = useGetPurchaseOrder(orderId, {
    query: {
      enabled: isValidId,
    },
  });

  const detailQuery = useGetAllPurchaseOrderDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId, sort: ['id,asc'] } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const historyQuery = useGetAllPurchaseOrderHistories(
    includeHistory && isValidId
      ? { 'purchaseOrderId.equals': orderId, sort: ['createdDate,desc'] }
      : undefined,
    {
      query: {
        enabled: includeHistory && isValidId,
      },
    }
  );

  const addressQuery = useGetAllPurchaseOrderAddressDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const shippingQuery = useGetAllPurchaseOrderShippingDetails(
    isValidId ? { 'purchaseOrderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const orderRecord = useMemo(() => {
    if (!orderQuery.data) return undefined;

    const orderDto = orderQuery.data;
    const baseRecord = mapOrderDtoToRecord(orderDto);

    return {
      ...baseRecord,
      items: mapOrderDetails(detailQuery.data),
      history: includeHistory ? mapOrderHistoryEntries(historyQuery.data) : [],
      address: mapOrderAddressDetail(addressQuery.data?.[0], orderDto),
      shipping: mapOrderShippingDetail(shippingQuery.data?.[0], orderDto),
    };
  }, [
    addressQuery.data,
    detailQuery.data,
    historyQuery.data,
    includeHistory,
    orderQuery.data,
    shippingQuery.data,
  ]);

  return {
    orderDto: orderQuery.data,
    orderRecord,
    addressExists: Boolean(addressQuery.data?.length),
    shippingExists: Boolean(shippingQuery.data?.length),
    isLoading:
      orderQuery.isLoading ||
      detailQuery.isLoading ||
      addressQuery.isLoading ||
      shippingQuery.isLoading ||
      (includeHistory && historyQuery.isLoading),
    isError:
      orderQuery.isError ||
      detailQuery.isError ||
      addressQuery.isError ||
      shippingQuery.isError ||
      (includeHistory && historyQuery.isError),
  };
}
