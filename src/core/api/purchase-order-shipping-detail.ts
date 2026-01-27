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

export type GetAllPurchaseOrderShippingDetailsParams = {
    'id.equals'?: number;
    'purchaseOrderId.equals'?: number;
    'purchaseOrderId.in'?: number[];
    page?: number;
    size?: number;
    sort?: string[];
};

export const getAllPurchaseOrderShippingDetails = (
    params?: GetAllPurchaseOrderShippingDetailsParams,
    signal?: AbortSignal
) =>
    springServiceMutator<PurchaseOrderShippingDetailDTO[]>({
        url: '/api/purchase-order-shipping-details',
        method: 'GET',
        params,
        signal,
    });

export const useGetAllPurchaseOrderShippingDetails = (
    params?: GetAllPurchaseOrderShippingDetailsParams,
    options?: { query?: Partial<UseQueryOptions<PurchaseOrderShippingDetailDTO[], Error>> },
    queryClient?: QueryClient
): UseQueryResult<PurchaseOrderShippingDetailDTO[], Error> & { queryKey: QueryKey } => {
    const queryOptions = options?.query ?? {};
    const queryKey = queryOptions.queryKey ?? ['/api/purchase-order-shipping-details', params];
    const queryFn: QueryFunction<PurchaseOrderShippingDetailDTO[]> = ({ signal }) =>
        getAllPurchaseOrderShippingDetails(params, signal);

    const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
        PurchaseOrderShippingDetailDTO[],
        Error
    > & { queryKey: QueryKey };

    query.queryKey = queryKey;
    return query;
};

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
            mutationFn: ({ data }: { data: PurchaseOrderShippingDetailDTO }) => createPurchaseOrderShippingDetail(data),
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
            mutationFn: ({ id, data }: { id: number; data: PurchaseOrderShippingDetailDTO }) => updatePurchaseOrderShippingDetail(id, data),
            ...options,
        },
        queryClient
    );
