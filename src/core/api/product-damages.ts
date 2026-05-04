import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface ProductDamage {
  id?: number;
  productId?: number;
  productName?: string;
  variantId?: number;
  variantSku?: string;
  warehouseId?: number;
  warehouseName?: string;
  quantity?: number;
  unitPrice?: number;
  totalValue?: number;
  orderDetailId?: number;
  remarks?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface ProductDamageParams {
  page?: number;
  size?: number;
  sort?: string[];
  productId?: number;
  warehouseId?: number;
  productName?: string;
  warehouseName?: string;
  dateFrom?: string;
  dateTo?: string;
}

const buildSearchParams = (params?: ProductDamageParams) => {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, String(entry)));

      return;
    }

    // Use .contains for string searches (productName, warehouseName)
    if (key === 'productName' || key === 'warehouseName') {
      searchParams.set(`${key}.contains`, String(value));
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

export const getProductDamages = (params?: ProductDamageParams, signal?: AbortSignal) => {
  const query = buildSearchParams(params);

  return springServiceMutator<ProductDamage[]>({
    url: `/api/product-damages${query ? `?${query}` : ''}`,
    method: 'GET',
    signal,
  });
};

export const useGetProductDamages = (
  params?: ProductDamageParams,
  options?: { query?: Partial<UseQueryOptions<ProductDamage[], Error>> }
): UseQueryResult<ProductDamage[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['getProductDamages', params];
  const queryFn: QueryFunction<ProductDamage[]> = ({ signal }) => getProductDamages(params, signal);
  const query = useQuery({ queryKey, queryFn, ...queryOptions }) as UseQueryResult<
    ProductDamage[],
    Error
  > & {
    queryKey: QueryKey;
  };

  query.queryKey = queryKey;

  return query;
};

export const createProductDamage = (data: ProductDamage) =>
  springServiceMutator<ProductDamage>({
    url: '/api/product-damages',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });

export const useCreateProductDamage = () =>
  useMutation({
    mutationFn: createProductDamage,
  });
