import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export type OrderItemStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'PICKED'
  | 'PACKED'
  | 'PENDING'
  | 'COMPLETED'
  | 'ISSUE'
  | 'CANCELLED';

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId?: number;
  variantId?: number;
  productCatalogId?: number;
  warehouseId?: number;
  productName?: string;
  sku?: string;
  variantAttributes?: string;
  itemTotalAmount?: number;
  quantity?: number;
  backOrderQuantity?: number;
  itemStatus?: OrderItemStatus;
  itemPrice?: number;
  comment?: string;
  itemComment?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface OrderItemsByStatusParams {
  page?: number;
  size?: number;
  sort?: string[];
  dateFrom?: string;
  dateTo?: string;
  productName?: string;
  comment?: string;
}

export interface UpdateOrderItemStatusRequest {
  orderDetailId: number;
  newStatus: OrderItemStatus;
  comment?: string;
  orderId?: number;
}

const buildSearchParams = (status: OrderItemStatus, params?: OrderItemsByStatusParams) => {
  const searchParams = new URLSearchParams();

  searchParams.set('itemStatus.equals', status);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, String(entry)));

      return;
    }

    if (key === 'dateFrom') {
      searchParams.set('createdDate.greaterThanOrEqual', String(value));
    } else if (key === 'dateTo') {
      searchParams.set('createdDate.lessThanOrEqual', String(value));
    } else if (key === 'productName') {
      searchParams.set('productName.contains', String(value));
    } else if (key === 'comment') {
      searchParams.set('comment.contains', String(value));
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

export const getOrderItemsByStatus = (
  status: OrderItemStatus,
  params?: OrderItemsByStatusParams,
  signal?: AbortSignal
) => {
  const query = buildSearchParams(status, params);

  return springServiceMutator<OrderItem[]>({
    url: `/api/order-details${query ? `?${query}` : ''}`,
    method: 'GET',
    signal,
  });
};

export const useGetOrderItemsByStatus = (
  status: OrderItemStatus,
  params?: OrderItemsByStatusParams,
  options?: { query?: Partial<UseQueryOptions<OrderItem[], Error>> }
): UseQueryResult<OrderItem[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['getOrderItemsByStatus', status, params];
  const queryFn: QueryFunction<OrderItem[]> = ({ signal }) =>
    getOrderItemsByStatus(status, params, signal);
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as UseQueryResult<
    OrderItem[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const updateOrderItemStatus = ({
  orderDetailId,
  newStatus,
  comment,
}: UpdateOrderItemStatusRequest) =>
  springServiceMutator<OrderItem>({
    url: `/api/order-details/${orderDetailId}/update-status`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { orderDetailId, newStatus, comment },
  });

export const useUpdateOrderItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderItemStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['getOrderItemsByStatus'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (typeof variables.orderId === 'number') {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${variables.orderId}`] });
      }
    },
  });
};
