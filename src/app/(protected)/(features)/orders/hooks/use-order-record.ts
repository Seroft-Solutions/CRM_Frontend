'use client';

import { useMemo } from 'react';
import { useGetAllOrderAddressDetails } from '@/core/api/generated/spring/endpoints/order-address-detail-resource/order-address-detail-resource.gen';
import { useGetAllOrderDetails } from '@/core/api/generated/spring/endpoints/order-detail-resource/order-detail-resource.gen';
import { useGetAllOrderHistories } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { useGetOrder } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { useGetAllOrderShippingDetails } from '@/core/api/order-shipping-detail';
import {
  mapOrderAddressDetail,
  mapOrderDetails,
  mapOrderDtoToRecord,
  mapOrderHistoryEntries,
  mapOrderShippingDetail,
} from '../data/order-data';

interface UseOrderRecordOptions {
  includeHistory?: boolean;
}

export function useOrderRecord(orderId: number, options: UseOrderRecordOptions = {}) {
  const { includeHistory = true } = options;
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
    includeHistory && isValidId ? { 'orderId.equals': orderId, sort: ['createdDate,desc'] } : undefined,
    {
      query: {
        enabled: includeHistory && isValidId,
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
