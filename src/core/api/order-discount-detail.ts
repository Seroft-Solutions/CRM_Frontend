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

export interface OrderDiscountDetailDTO {
  id?: number;
  orderId?: number;
  discountAmount?: number;
  discountType?: number;
  discountCode?: string;
  discountMode?: number;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  maxDiscountValue?: number;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export type GetAllOrderDiscountDetailsParams = {
  'id.equals'?: number;
  'id.in'?: number[];
  'orderId.equals'?: number;
  'orderId.in'?: number[];
  'discountAmount.equals'?: number;
  'discountType.equals'?: number;
  'discountCode.contains'?: string;
  'discountMode.equals'?: number;
  'startDate.greaterThanOrEqual'?: string;
  'endDate.lessThanOrEqual'?: string;
  page?: number;
  size?: number;
  sort?: string[];
};

export const getAllOrderDiscountDetails = (
  params?: GetAllOrderDiscountDetailsParams,
  signal?: AbortSignal
) =>
  springServiceMutator<OrderDiscountDetailDTO[]>({
    url: '/api/order-discount-details',
    method: 'GET',
    params,
    signal,
  });

export const useGetAllOrderDiscountDetails = (
  params?: GetAllOrderDiscountDetailsParams,
  options?: { query?: UseQueryOptions<OrderDiscountDetailDTO[], Error> },
  queryClient?: QueryClient
): UseQueryResult<OrderDiscountDetailDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['/api/order-discount-details', params];
  const queryFn: QueryFunction<OrderDiscountDetailDTO[]> = ({ signal }) =>
    getAllOrderDiscountDetails(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    OrderDiscountDetailDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};

export const createOrderDiscountDetail = (orderDiscountDetailDTO: OrderDiscountDetailDTO) =>
  springServiceMutator<OrderDiscountDetailDTO>({
    url: '/api/order-discount-details',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: orderDiscountDetailDTO,
  });

export const useCreateOrderDiscountDetail = (
  options?: UseMutationOptions<OrderDiscountDetailDTO, Error, { data: OrderDiscountDetailDTO }>,
  queryClient?: QueryClient
): UseMutationResult<OrderDiscountDetailDTO, Error, { data: OrderDiscountDetailDTO }> =>
  useMutation(
    {
      mutationFn: ({ data }) => createOrderDiscountDetail(data),
      ...options,
    },
    queryClient
  );

export const updateOrderDiscountDetail = (id: number, orderDiscountDetailDTO: OrderDiscountDetailDTO) =>
  springServiceMutator<OrderDiscountDetailDTO>({
    url: `/api/order-discount-details/${id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: orderDiscountDetailDTO,
  });

export const useUpdateOrderDiscountDetail = (
  options?: UseMutationOptions<
    OrderDiscountDetailDTO,
    Error,
    { id: number; data: OrderDiscountDetailDTO }
  >,
  queryClient?: QueryClient
): UseMutationResult<OrderDiscountDetailDTO, Error, { id: number; data: OrderDiscountDetailDTO }> =>
  useMutation(
    {
      mutationFn: ({ id, data }) => updateOrderDiscountDetail(id, data),
      ...options,
    },
    queryClient
  );
