import { useMutation } from '@tanstack/react-query';
import type {
    QueryClient,
    UseMutationOptions,
    UseMutationResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface PurchaseOrderHistoryDTO {
    id?: number;
    purchaseOrderId?: number;
    status?: string;
    notificationSent?: boolean;
    updatedBy?: string;
    lastUpdated?: string;
    createdBy?: string;
    createdDate?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
}

export const createPurchaseOrderHistory = (purchaseOrderHistoryDTO: PurchaseOrderHistoryDTO) =>
    springServiceMutator<PurchaseOrderHistoryDTO>({
        url: '/api/purchase-order-histories',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderHistoryDTO,
    });

export const useCreatePurchaseOrderHistory = (
    options?: UseMutationOptions<PurchaseOrderHistoryDTO, Error, { data: PurchaseOrderHistoryDTO }>,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderHistoryDTO, Error, { data: PurchaseOrderHistoryDTO }> =>
    useMutation(
        {
            mutationFn: ({ data }) => createPurchaseOrderHistory(data),
            ...options,
        },
        queryClient
    );
