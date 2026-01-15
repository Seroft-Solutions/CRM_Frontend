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

export interface OrderShippingDetailDTO {
  id?: number;
  orderId?: number;
  shippingAmount?: number;
  shippingMethod?: number;
  shippingId?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export type GetAllOrderShippingDetailsParams = {
  'id.equals'?: number;
  'id.in'?: number[];
  'orderId.equals'?: number;
  'orderId.in'?: number[];
  'shippingAmount.greaterThan'?: number;
  'shippingAmount.lessThan'?: number;
  'shippingAmount.equals'?: number;
  'shippingMethod.equals'?: number;
  'shippingId.contains'?: string;
  'shippingId.equals'?: string;
  page?: number;
  size?: number;
  sort?: string[];
};

export const getAllOrderShippingDetails = (
  params?: GetAllOrderShippingDetailsParams,
  signal?: AbortSignal
) =>
  springServiceMutator<OrderShippingDetailDTO[]>({
    url: '/api/order-shipping-details',
    method: 'GET',
    params,
    signal,
  });

export const useGetAllOrderShippingDetails = (
  params?: GetAllOrderShippingDetailsParams,
  options?: { query?: UseQueryOptions<OrderShippingDetailDTO[], Error> },
  queryClient?: QueryClient
): UseQueryResult<OrderShippingDetailDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['/api/order-shipping-details', params];
  const queryFn: QueryFunction<OrderShippingDetailDTO[]> = ({ signal }) =>
    getAllOrderShippingDetails(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    OrderShippingDetailDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};

export const createOrderShippingDetail = (orderShippingDetailDTO: OrderShippingDetailDTO) =>
  springServiceMutator<OrderShippingDetailDTO>({
    url: '/api/order-shipping-details',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: orderShippingDetailDTO,
  });

export const useCreateOrderShippingDetail = (
  options?: UseMutationOptions<OrderShippingDetailDTO, Error, { data: OrderShippingDetailDTO }>,
  queryClient?: QueryClient
): UseMutationResult<OrderShippingDetailDTO, Error, { data: OrderShippingDetailDTO }> =>
  useMutation(
    {
      mutationFn: ({ data }) => createOrderShippingDetail(data),
      ...options,
    },
    queryClient
  );

export const updateOrderShippingDetail = (id: number, orderShippingDetailDTO: OrderShippingDetailDTO) =>
  springServiceMutator<OrderShippingDetailDTO>({
    url: `/api/order-shipping-details/${id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: orderShippingDetailDTO,
  });

export const useUpdateOrderShippingDetail = (
  options?: UseMutationOptions<
    OrderShippingDetailDTO,
    Error,
    { id: number; data: OrderShippingDetailDTO }
  >,
  queryClient?: QueryClient
): UseMutationResult<OrderShippingDetailDTO, Error, { id: number; data: OrderShippingDetailDTO }> =>
  useMutation(
    {
      mutationFn: ({ id, data }) => updateOrderShippingDetail(id, data),
      ...options,
    },
    queryClient
  );
