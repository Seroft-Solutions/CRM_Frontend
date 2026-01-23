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
import type { SundryCreditorDTO } from '@/app/(protected)/(features)/sundry-creditors/api/sundry-creditor';

export interface PurchaseOrderDTO {
  id?: number;
  orderStatus?: number;
  orderTotalAmount?: number;
  orderTaxRate?: number;
  orderBaseAmount?: number;
  shippingAmount?: number;
  userType?: number;
  phone?: string;
  email?: string;
  paymentStatus?: number;
  notificationType?: number;
  sundryCreditor?: SundryCreditorDTO;
  discountCode?: string;
  busyFlag?: number;
  busyVoucherId?: string;
  updatedBy?: number;
  lastUpdated?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export type GetAllPurchaseOrdersParams = Record<string, any>;
export type CountPurchaseOrdersParams = Record<string, any>;

export const getAllPurchaseOrders = (params?: GetAllPurchaseOrdersParams, signal?: AbortSignal) =>
  springServiceMutator<PurchaseOrderDTO[]>({
    url: '/api/purchase-orders',
    method: 'GET',
    params,
    signal,
  });

export const getPurchaseOrder = (id: number, signal?: AbortSignal) =>
  springServiceMutator<PurchaseOrderDTO>({
    url: `/api/purchase-orders/${id}`,
    method: 'GET',
    signal,
  });

export const countPurchaseOrders = (params?: CountPurchaseOrdersParams, signal?: AbortSignal) =>
  springServiceMutator<number>({
    url: '/api/purchase-orders/count',
    method: 'GET',
    params,
    signal,
  });

export const createPurchaseOrder = (purchaseOrderDTO: PurchaseOrderDTO) =>
  springServiceMutator<PurchaseOrderDTO>({
    url: '/api/purchase-orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: purchaseOrderDTO,
  });

export const updatePurchaseOrder = (id: number, purchaseOrderDTO: PurchaseOrderDTO) =>
  springServiceMutator<PurchaseOrderDTO>({
    url: `/api/purchase-orders/${id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: purchaseOrderDTO,
  });

export const useGetAllPurchaseOrders = (
  params?: GetAllPurchaseOrdersParams,
  options?: { query?: Partial<UseQueryOptions<PurchaseOrderDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<PurchaseOrderDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['/api/purchase-orders', params];
  const queryFn: QueryFunction<PurchaseOrderDTO[]> = ({ signal }) =>
    getAllPurchaseOrders(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    PurchaseOrderDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};

export const useGetPurchaseOrder = (
  id: number,
  options?: { query?: Partial<UseQueryOptions<PurchaseOrderDTO, Error>> },
  queryClient?: QueryClient
): UseQueryResult<PurchaseOrderDTO, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? [`/api/purchase-orders/${id}`];
  const queryFn: QueryFunction<PurchaseOrderDTO> = ({ signal }) => getPurchaseOrder(id, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    PurchaseOrderDTO,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};

export const useCountPurchaseOrders = (
  params?: CountPurchaseOrdersParams,
  options?: { query?: Partial<UseQueryOptions<number, Error>> },
  queryClient?: QueryClient
): UseQueryResult<number, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['/api/purchase-orders/count', params];
  const queryFn: QueryFunction<number> = ({ signal }) => countPurchaseOrders(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    number,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};

export const useCreatePurchaseOrder = (
  options?: UseMutationOptions<PurchaseOrderDTO, Error, { data: PurchaseOrderDTO }>,
  queryClient?: QueryClient
): UseMutationResult<PurchaseOrderDTO, Error, { data: PurchaseOrderDTO }> =>
  useMutation(
    {
      mutationFn: ({ data }) => createPurchaseOrder(data),
      ...options,
    },
    queryClient
  );

export const useUpdatePurchaseOrder = (
  options?: UseMutationOptions<PurchaseOrderDTO, Error, { id: number; data: PurchaseOrderDTO }>,
  queryClient?: QueryClient
): UseMutationResult<PurchaseOrderDTO, Error, { id: number; data: PurchaseOrderDTO }> =>
  useMutation(
    {
      mutationFn: ({ id, data }) => updatePurchaseOrder(id, data),
      ...options,
    },
    queryClient
  );
