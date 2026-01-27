import { useMutation } from '@tanstack/react-query';
import type {
    QueryClient,
    UseMutationOptions,
    UseMutationResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface PurchaseOrderDetailDTO {
    id?: number;
    purchaseOrderId?: number;
    productId?: number;
    variantId?: number;
    productCatalogId?: number;
    productName?: string;
    sku?: string;
    variantAttributes?: string;
    itemTotalAmount?: number;
    quantity?: number;
    itemPrice?: number;
    itemTaxAmount?: number;
    itemStatus?: number;
    itemComment?: string;
    updatedBy?: string;
    lastUpdated?: string;
    createdBy?: string;
    createdDate?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
}

export const createPurchaseOrderDetail = (purchaseOrderDetailDTO: PurchaseOrderDetailDTO) =>
    springServiceMutator<PurchaseOrderDetailDTO>({
        url: '/api/purchase-order-details',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderDetailDTO,
    });

export const useCreatePurchaseOrderDetail = (
    options?: UseMutationOptions<PurchaseOrderDetailDTO, Error, { data: PurchaseOrderDetailDTO }>,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderDetailDTO, Error, { data: PurchaseOrderDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ data }: { data: PurchaseOrderDetailDTO }) => createPurchaseOrderDetail(data),
            ...options,
        },
        queryClient
    );

export const updatePurchaseOrderDetail = (id: number, purchaseOrderDetailDTO: PurchaseOrderDetailDTO) =>
    springServiceMutator<PurchaseOrderDetailDTO>({
        url: `/api/purchase-order-details/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderDetailDTO,
    });

export const useUpdatePurchaseOrderDetail = (
    options?: UseMutationOptions<
        PurchaseOrderDetailDTO,
        Error,
        { id: number; data: PurchaseOrderDetailDTO }
    >,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderDetailDTO, Error, { id: number; data: PurchaseOrderDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ id, data }: { id: number; data: PurchaseOrderDetailDTO }) => updatePurchaseOrderDetail(id, data),
            ...options,
        },
        queryClient
    );

export const deletePurchaseOrderDetail = (id: number) =>
    springServiceMutator<void>({
        url: `/api/purchase-order-details/${id}`,
        method: 'DELETE',
    });

export const useDeletePurchaseOrderDetail = (
    options?: UseMutationOptions<void, Error, { id: number }>,
    queryClient?: QueryClient
): UseMutationResult<void, Error, { id: number }> =>
    useMutation(
        {
            mutationFn: ({ id }: { id: number }) => deletePurchaseOrderDetail(id),
            ...options,
        },
        queryClient
    );
