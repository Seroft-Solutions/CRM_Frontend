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

export type GetAllPurchaseOrderHistoriesParams = {
    'id.equals'?: number;
    'purchaseOrderId.equals'?: number;
    'purchaseOrderId.in'?: number[];
    page?: number;
    size?: number;
    sort?: string[];
};

export const getAllPurchaseOrderHistories = (
    params?: GetAllPurchaseOrderHistoriesParams,
    signal?: AbortSignal
) =>
    springServiceMutator<PurchaseOrderHistoryDTO[]>({
        url: '/api/purchase-order-histories',
        method: 'GET',
        params,
        signal,
    });

export const useGetAllPurchaseOrderHistories = (
    params?: GetAllPurchaseOrderHistoriesParams,
    options?: { query?: Partial<UseQueryOptions<PurchaseOrderHistoryDTO[], Error>> },
    queryClient?: QueryClient
): UseQueryResult<PurchaseOrderHistoryDTO[], Error> & { queryKey: QueryKey } => {
    const queryOptions = options?.query ?? {};
    const queryKey = queryOptions.queryKey ?? ['/api/purchase-order-histories', params];
    const queryFn: QueryFunction<PurchaseOrderHistoryDTO[]> = ({ signal }) =>
        getAllPurchaseOrderHistories(params, signal);

    const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
        PurchaseOrderHistoryDTO[],
        Error
    > & { queryKey: QueryKey };

    query.queryKey = queryKey;
    return query;
};

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
            mutationFn: ({ data }: { data: PurchaseOrderHistoryDTO }) => createPurchaseOrderHistory(data),
            ...options,
        },
        queryClient
    );
