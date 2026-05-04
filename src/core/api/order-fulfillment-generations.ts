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

export interface OrderFulfillmentGenerationItemRequest {
  orderDetailId: number;
  quantity: number;
  damageQuantity?: number;
  damageRemarks?: string;
}

export interface OrderFulfillmentGenerationRequest {
  items: OrderFulfillmentGenerationItemRequest[];
  notes?: string;
}

export interface OrderFulfillmentGenerationItemResponse {
  id?: number;
  orderDetailId?: number;
  productName?: string;
  sku?: string;
  requestedQuantity?: number;
  deliveredQuantity?: number;
  availableQuantityBefore?: number;
  remainingBacklogQuantity?: number;
  totalGeneratedQuantityAfter?: number;
}

export interface OrderFulfillmentGenerationResponse {
  id?: number;
  orderId?: number;
  generationNumber?: number;
  totalGeneratedQuantity?: number;
  totalBacklogQuantity?: number;
  notes?: string;
  createdBy?: string;
  createdDate?: string;
  items?: OrderFulfillmentGenerationItemResponse[];
}

export const getOrderFulfillmentGenerations = (orderId: number, signal?: AbortSignal) =>
  springServiceMutator<OrderFulfillmentGenerationResponse[]>({
    url: `/api/orders/${orderId}/fulfillment-generations`,
    method: 'GET',
    signal,
  });

export const useGetOrderFulfillmentGenerations = (
  orderId: number,
  options?: { query?: Partial<UseQueryOptions<OrderFulfillmentGenerationResponse[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<OrderFulfillmentGenerationResponse[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? [`/api/orders/${orderId}/fulfillment-generations`];
  const queryFn: QueryFunction<OrderFulfillmentGenerationResponse[]> = ({ signal }) =>
    getOrderFulfillmentGenerations(orderId, signal);

  const query = useQuery(
    { queryKey, queryFn, enabled: orderId > 0, ...queryOptions },
    queryClient
  ) as UseQueryResult<OrderFulfillmentGenerationResponse[], Error> & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const createOrderFulfillmentGeneration = (
  orderId: number,
  payload: OrderFulfillmentGenerationRequest
) =>
  springServiceMutator<OrderFulfillmentGenerationResponse>({
    url: `/api/orders/${orderId}/fulfillment-generations`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  });

export const useCreateOrderFulfillmentGeneration = (
  options?: UseMutationOptions<
    OrderFulfillmentGenerationResponse,
    Error,
    { orderId: number; data: OrderFulfillmentGenerationRequest }
  >,
  queryClient?: QueryClient
): UseMutationResult<
  OrderFulfillmentGenerationResponse,
  Error,
  { orderId: number; data: OrderFulfillmentGenerationRequest }
> =>
  useMutation(
    {
      mutationFn: ({ orderId, data }) => createOrderFulfillmentGeneration(orderId, data),
      ...options,
    },
    queryClient
  );
