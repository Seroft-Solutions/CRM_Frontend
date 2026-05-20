'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { PurchaseOrderApproveDTO } from '../data/purchase-order-data';

type ApprovePurchaseOrderVariables = {
  orderId: number;
  approveDTO: PurchaseOrderApproveDTO;
};

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approveDTO }: ApprovePurchaseOrderVariables) => {
      return springServiceMutator<PurchaseOrderApproveDTO>(
        {
          url: '/api/purchase-order-details/bulk-update-status',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: approveDTO.items.map((item) => ({
            orderDetailId: item.orderDetailId,
            newStatus: 'APPROVED',
            approvedQuantity: item.approvedQuantity,
          })),
        },
        undefined
      );
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/purchase-orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-order-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-variants'] });
    },
  });
}
