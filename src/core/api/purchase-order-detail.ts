import { useMutation, useQuery } from '@tanstack/react-query';
import type {
    QueryClient,
    QueryFunction,
    QueryKey,
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
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

export type GetAllPurchaseOrderDetailsParams = {
    'id.equals'?: number;
    'purchaseOrderId.equals'?: number;
    'purchaseOrderId.in'?: number[];
    page?: number;
    size?: number;
    sort?: string[];
};

export const getAllPurchaseOrderDetails = (
    params?: GetAllPurchaseOrderDetailsParams,
    signal?: AbortSignal
) =>
    springServiceMutator<PurchaseOrderDetailDTO[]>({
        url: '/api/purchase-order-details',
        method: 'GET',
        params,
        signal,
    });

export const useGetAllPurchaseOrderDetails = (
    params?: GetAllPurchaseOrderDetailsParams,
    options?: { query?: Partial<UseQueryOptions<PurchaseOrderDetailDTO[], Error>> },
    queryClient?: QueryClient
): UseQueryResult<PurchaseOrderDetailDTO[], Error> & { queryKey: QueryKey } => {
    const queryOptions = options?.query ?? {};
    const queryKey = queryOptions.queryKey ?? ['/api/purchase-order-details', params];
    const queryFn: QueryFunction<PurchaseOrderDetailDTO[]> = ({ signal }) =>
        getAllPurchaseOrderDetails(params, signal);

    const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
        PurchaseOrderDetailDTO[],
        Error
    > & { queryKey: QueryKey };

    query.queryKey = queryKey;
    return query;
};

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
