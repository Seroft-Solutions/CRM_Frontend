import { useMutation } from '@tanstack/react-query';
import type {
    QueryClient,
    UseMutationOptions,
    UseMutationResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface PurchaseOrderShippingDetailDTO {
    id?: number;
    purchaseOrderId?: number;
    shippingAmount?: number;
    shippingMethod?: number;
    shippingId?: string;
    createdBy?: string;
    createdDate?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
}

export const createPurchaseOrderShippingDetail = (purchaseOrderShippingDetailDTO: PurchaseOrderShippingDetailDTO) =>
    springServiceMutator<PurchaseOrderShippingDetailDTO>({
        url: '/api/purchase-order-shipping-details',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderShippingDetailDTO,
    });

export const useCreatePurchaseOrderShippingDetail = (
    options?: UseMutationOptions<PurchaseOrderShippingDetailDTO, Error, { data: PurchaseOrderShippingDetailDTO }>,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderShippingDetailDTO, Error, { data: PurchaseOrderShippingDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ data }) => createPurchaseOrderShippingDetail(data),
            ...options,
        },
        queryClient
    );

export const updatePurchaseOrderShippingDetail = (id: number, purchaseOrderShippingDetailDTO: PurchaseOrderShippingDetailDTO) =>
    springServiceMutator<PurchaseOrderShippingDetailDTO>({
        url: `/api/purchase-order-shipping-details/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderShippingDetailDTO,
    });

export const useUpdatePurchaseOrderShippingDetail = (
    options?: UseMutationOptions<
        PurchaseOrderShippingDetailDTO,
        Error,
        { id: number; data: PurchaseOrderShippingDetailDTO }
    >,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderShippingDetailDTO, Error, { id: number; data: PurchaseOrderShippingDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ id, data }) => updatePurchaseOrderShippingDetail(id, data),
            ...options,
        },
        queryClient
    );
