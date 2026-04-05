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

export interface PurchaseOrderFulfillmentGenerationItemRequest {
  orderDetailId: number;
  quantity: number;
}

export interface PurchaseOrderFulfillmentGenerationRequest {
  items: PurchaseOrderFulfillmentGenerationItemRequest[];
  notes?: string;
}

export interface PurchaseOrderFulfillmentGenerationItemResponse {
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

export interface PurchaseOrderFulfillmentGenerationResponse {
  id?: number;
  orderId?: number;
  generationNumber?: number;
  totalGeneratedQuantity?: number;
  totalBacklogQuantity?: number;
  notes?: string;
  createdBy?: string;
  createdDate?: string;
  items?: PurchaseOrderFulfillmentGenerationItemResponse[];
}

export const getPurchaseOrderFulfillmentGenerations = (orderId: number, signal?: AbortSignal) =>
  springServiceMutator<PurchaseOrderFulfillmentGenerationResponse[]>({
    url: `/api/purchase-orders/${orderId}/fulfillment-generations`,
    method: 'GET',
    signal,
  });

export const useGetPurchaseOrderFulfillmentGenerations = (
  orderId: number,
  options?: {
    query?: Partial<UseQueryOptions<PurchaseOrderFulfillmentGenerationResponse[], Error>>;
  },
  queryClient?: QueryClient
): UseQueryResult<PurchaseOrderFulfillmentGenerationResponse[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? [
    `/api/purchase-orders/${orderId}/fulfillment-generations`,
  ];
  const queryFn: QueryFunction<PurchaseOrderFulfillmentGenerationResponse[]> = ({ signal }) =>
    getPurchaseOrderFulfillmentGenerations(orderId, signal);

  const query = useQuery(
    { queryKey, queryFn, enabled: orderId > 0, ...queryOptions },
    queryClient
  ) as UseQueryResult<PurchaseOrderFulfillmentGenerationResponse[], Error> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryKey;

  return query;
};

export const createPurchaseOrderFulfillmentGeneration = (
  orderId: number,
  payload: PurchaseOrderFulfillmentGenerationRequest
) =>
  springServiceMutator<PurchaseOrderFulfillmentGenerationResponse>({
    url: `/api/purchase-orders/${orderId}/fulfillment-generations`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  });

export const useCreatePurchaseOrderFulfillmentGeneration = (
  options?: UseMutationOptions<
    PurchaseOrderFulfillmentGenerationResponse,
    Error,
    { orderId: number; data: PurchaseOrderFulfillmentGenerationRequest }
  >,
  queryClient?: QueryClient
): UseMutationResult<
  PurchaseOrderFulfillmentGenerationResponse,
  Error,
  { orderId: number; data: PurchaseOrderFulfillmentGenerationRequest }
> =>
  useMutation(
    {
      mutationFn: ({ orderId, data }) => createPurchaseOrderFulfillmentGeneration(orderId, data),
      ...options,
    },
    queryClient
  );
