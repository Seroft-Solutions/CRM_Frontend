import { useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { ProductDTO } from '@/core/api/generated/spring/schemas/ProductDTO';

type ProductSummaryParams = Record<string, unknown>;
type ProductSummarySearchParams = ProductSummaryParams & { query: string };

const getProductSummaries = (params?: ProductSummaryParams, signal?: AbortSignal) =>
  springServiceMutator<ProductDTO[]>({
    url: '/api/products/summary',
    method: 'GET',
    params,
    signal,
  });

const searchProductSummaries = (params: ProductSummarySearchParams, signal?: AbortSignal) =>
  springServiceMutator<ProductDTO[]>({
    url: '/api/products/summary/_search',
    method: 'GET',
    params,
    signal,
  });

export const useProductSummariesQuery = (
  params?: ProductSummaryParams,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: ['product-summaries', params],
    queryFn: ({ signal }) => getProductSummaries(params, signal),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled,
  });

export const useSearchProductSummariesQuery = (
  params: ProductSummarySearchParams,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: ['product-summaries-search', params],
    queryFn: ({ signal }) => searchProductSummaries(params, signal),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled,
  });
