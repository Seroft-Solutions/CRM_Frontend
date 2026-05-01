'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { ErrorType } from '@/core/api/services/spring-service/service-mutator';
import type { OrderApproveDTO } from '../data/order-data';

type ApproveOrderVariables = {
  orderId: number;
  approveDTO: OrderApproveDTO;
};

export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, approveDTO }: ApproveOrderVariables) => {
      return springServiceMutator<OrderApproveDTO>(
        {
          url: `/api/orders/${orderId}/approve`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: approveDTO,
        },
        undefined
      );
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-variants'] });
    },
  });
}
