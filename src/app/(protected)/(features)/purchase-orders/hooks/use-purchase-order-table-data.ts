'use client';

import { useMemo } from 'react';
import {
  useCountPurchaseOrders,
  useGetAllPurchaseOrders,
  type CountPurchaseOrdersParams,
  type PurchaseOrderDTO,
} from '@/core/api/purchase-order';
import { useGetAllPurchaseOrderShippingDetails } from '@/core/api/purchase-order-shipping-detail';
import {
  getOrderStatusCode,
  mapOrderDtoToRecord,
  mapOrderShippingDetail,
  type OrderStatus,
} from '../data/purchase-order-data';

type EntityStatus = 'ACTIVE' | 'DRAFT';

interface UsePurchaseOrderTableDataParams {
  entityStatus: EntityStatus;
  statusFilter: OrderStatus | 'All';
  searchTerm: string;
  currentPage: number;
  pageSize: number;
}

export function usePurchaseOrderTableData({
  entityStatus,
  statusFilter,
  searchTerm,
  currentPage,
  pageSize,
}: UsePurchaseOrderTableDataParams) {
  const filterParams = useMemo<CountPurchaseOrdersParams>(() => {
    const params: CountPurchaseOrdersParams = {};
    (params as Record<string, unknown>)['status.equals'] = entityStatus;

    if (statusFilter !== 'All') {
      const statusCode = getOrderStatusCode(statusFilter);
      if (typeof statusCode === 'number') {
        params['orderStatus.equals'] = statusCode;
      }
    }

    const normalizedSearch = searchTerm.trim();
    if (normalizedSearch) {
      const numericOnly = /^\d+$/.test(normalizedSearch);
      const phoneLike = /^[+()\d\s-]+$/.test(normalizedSearch);
      const looksLikeOrderNumber =
        normalizedSearch.startsWith('#') ||
        /order/i.test(normalizedSearch);
      const extractedOrderId = normalizedSearch.replace(/\D/g, '');

      if (normalizedSearch.includes('@')) {
        params['email.contains'] = normalizedSearch;
      } else if (numericOnly) {
        params['id.equals'] = Number(normalizedSearch);
      } else if (looksLikeOrderNumber && extractedOrderId) {
        params['id.equals'] = Number(extractedOrderId);
      } else if (phoneLike) {
        params['phone.contains'] = normalizedSearch;
      }
    }

    return params;
  }, [entityStatus, searchTerm, statusFilter]);

  const apiPage = Math.max(currentPage - 1, 0);

  const ordersQuery = useGetAllPurchaseOrders(
    {
      page: apiPage,
      size: pageSize,
      sort: ['id,desc'],
      ...filterParams,
    },
    {
      query: {
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
        staleTime: 30_000,
      },
    }
  );

  const countQuery = useCountPurchaseOrders(filterParams, {
    query: {
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
      staleTime: 30_000,
    },
  });

  const orderDtos = ordersQuery.data ?? [];
  const orderRecords = useMemo(() => orderDtos.map(mapOrderDtoToRecord), [orderDtos]);
  const orderIds = useMemo(
    () => orderRecords.map((order) => order.orderId).filter((id) => id > 0),
    [orderRecords]
  );
  const orderDtoById = useMemo(
    () => new Map(orderDtos.map((order) => [order.id ?? 0, order] as const)),
    [orderDtos]
  );

  const shippingQuery = useGetAllPurchaseOrderShippingDetails(
    orderIds.length ? { 'purchaseOrderId.in': orderIds } : undefined,
    {
      query: {
        enabled: orderIds.length > 0,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
        staleTime: 30_000,
      },
    }
  );

  const shippingByOrderId = useMemo(
    () =>
      new Map(
        (shippingQuery.data ?? []).map((shipping) => [shipping.purchaseOrderId ?? 0, shipping] as const)
      ),
    [shippingQuery.data]
  );

  const orders = useMemo(() => {
    return orderRecords.map((orderRecord) => {
      const orderDto = orderDtoById.get(orderRecord.orderId) as PurchaseOrderDTO | undefined;
      const shippingDto = shippingByOrderId.get(orderRecord.orderId);

      return {
        ...orderRecord,
        shipping: mapOrderShippingDetail(shippingDto, orderDto),
      };
    });
  }, [orderDtoById, orderRecords, shippingByOrderId]);

  const totalCount = countQuery.data ?? orders.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    filterParams,
    orderDtos,
    orders,
    totalCount,
    totalPages,
    isLoading:
      (ordersQuery.isLoading && !ordersQuery.data) ||
      (shippingQuery.isLoading && orderIds.length > 0 && !shippingQuery.data),
    isError: ordersQuery.isError || countQuery.isError || shippingQuery.isError,
  };
}
