'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { OrderDetailDTO } from '@/core/api/generated/spring/schemas';
import type { ItemStatusCode } from '../data/order-data';

export type OrderDetailStatusUpdate = {
  orderDetailId: number;
  newStatus: ItemStatusCode;
  orderId?: number;
};

export function useUpdateOrderDetailStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderDetailId, newStatus }: OrderDetailStatusUpdate) =>
      springServiceMutator<OrderDetailDTO>(
        {
          url: `/api/order-details/${orderDetailId}/update-status`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { orderDetailId, newStatus },
        },
        undefined
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (typeof variables.orderId === 'number') {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${variables.orderId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
    },
  });
}

export function useBulkUpdateOrderDetailStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: OrderDetailStatusUpdate[]) =>
      springServiceMutator<OrderDetailDTO[]>(
        {
          url: '/api/order-details/bulk-update-status',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: items,
        },
        undefined
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      variables
        .map((item) => item.orderId)
        .filter((orderId): orderId is number => typeof orderId === 'number')
        .forEach((orderId) => {
          queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
        });
      queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
    },
  });
}
