'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  useCountPurchaseOrders,
  useGetAllPurchaseOrders,
  type CountPurchaseOrdersParams,
  type PurchaseOrderDTO,
} from '@/core/api/purchase-order';
import { useGetAllPurchaseOrderDetails } from '@/core/api/purchase-order-detail';
import { getPurchaseOrderFulfillmentGenerations } from '@/core/api/purchase-order-fulfillment-generations';
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
        /order/i.test(normalizedSearch) ||
        /^(ord|po|so)[-/\s]?\d+/i.test(normalizedSearch);
      const extractedOrderId = normalizedSearch.match(/\d+/)?.[0];

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
        (shippingQuery.data ?? []).map(
          (shipping) => [shipping.purchaseOrderId ?? 0, shipping] as const
        )
      ),
    [shippingQuery.data]
  );

  const detailsQuery = useGetAllPurchaseOrderDetails(
    orderIds.length ? { 'purchaseOrderId.in': orderIds, size: 9999 } : undefined,
    {
      query: {
        enabled: orderIds.length > 0,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
        staleTime: 30_000,
      },
    }
  );

  const fulfillmentGenerationQueries = useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: [`/api/purchase-orders/${orderId}/fulfillment-generations`],
      queryFn: ({ signal }) => getPurchaseOrderFulfillmentGenerations(orderId, signal),
      enabled: orderId > 0,
      staleTime: 30_000,
    })),
  });

  const receivedQuantityByOrderDetailId = useMemo(() => {
    const map = new Map<number, number>();

    fulfillmentGenerationQueries.forEach((query) => {
      query.data?.forEach((generation) => {
        generation.items?.forEach((item) => {
          if (typeof item.orderDetailId !== 'number') {
            return;
          }

          map.set(
            item.orderDetailId,
            (map.get(item.orderDetailId) ?? 0) + Math.max(0, item.deliveredQuantity ?? 0)
          );
        });
      });
    });

    return map;
  }, [fulfillmentGenerationQueries]);

  const itemCountByOrderId = useMemo(() => {
    const map = new Map<number, number>();

    (detailsQuery.data ?? []).forEach((detail) => {
      const orderId = detail.purchaseOrderId ?? 0;
      const qty =
        Math.max(0, detail.quantity ?? 0) +
        Math.max(0, detail.backOrderQuantity ?? 0) +
        (typeof detail.id === 'number' ? (receivedQuantityByOrderDetailId.get(detail.id) ?? 0) : 0);

      map.set(orderId, (map.get(orderId) ?? 0) + qty);
    });

    return map;
  }, [detailsQuery.data, receivedQuantityByOrderDetailId]);

  const orders = useMemo(() => {
    return orderRecords.map((orderRecord) => {
      const orderDto = orderDtoById.get(orderRecord.orderId) as PurchaseOrderDTO | undefined;
      const shippingDto = shippingByOrderId.get(orderRecord.orderId);

      return {
        ...orderRecord,
        totalItemQuantity: itemCountByOrderId.get(orderRecord.orderId) ?? 0,
        shipping: mapOrderShippingDetail(shippingDto, orderDto),
      };
    });
  }, [orderDtoById, orderRecords, shippingByOrderId, itemCountByOrderId]);

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
      (shippingQuery.isLoading && orderIds.length > 0 && !shippingQuery.data) ||
      fulfillmentGenerationQueries.some((query) => query.isLoading && !query.data),
    isError:
      ordersQuery.isError ||
      countQuery.isError ||
      shippingQuery.isError ||
      fulfillmentGenerationQueries.some((query) => query.isError),
  };
}
