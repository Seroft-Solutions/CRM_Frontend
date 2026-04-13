'use client';

import { useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface ProductPriceHistoryEntry {
  id?: number;
  productId?: number;
  previousBasePrice?: number | null;
  newBasePrice?: number | null;
  previousDiscountedPrice?: number | null;
  newDiscountedPrice?: number | null;
  previousSalePrice?: number | null;
  newSalePrice?: number | null;
  changedBy?: string | null;
  changedAt?: string | null;
}

export interface ProductVariantPriceHistoryEntry {
  id?: number;
  productId?: number;
  productVariantId?: number;
  sku?: string | null;
  linkId?: string | null;
  previousPrice?: number | null;
  newPrice?: number | null;
  changedBy?: string | null;
  changedAt?: string | null;
}

const getProductPriceHistory = (productId: number, signal?: AbortSignal) =>
  springServiceMutator<ProductPriceHistoryEntry[]>({
    url: `/api/products/${productId}/price-history`,
    method: 'GET',
    signal,
  });

const getProductVariantPriceHistory = (productId: number, signal?: AbortSignal) =>
  springServiceMutator<ProductVariantPriceHistoryEntry[]>({
    url: `/api/products/${productId}/variant-price-history`,
    method: 'GET',
    signal,
  });

export const useProductPriceHistoryQuery = (productId: number) =>
  useQuery({
    queryKey: ['product-price-history', productId],
    queryFn: ({ signal }) => getProductPriceHistory(productId, signal),
    enabled: Number.isFinite(productId) && productId > 0,
    placeholderData: (previousData) => previousData,
  });

export const useProductVariantPriceHistoryQuery = (productId: number) =>
  useQuery({
    queryKey: ['product-variant-price-history', productId],
    queryFn: ({ signal }) => getProductVariantPriceHistory(productId, signal),
    enabled: Number.isFinite(productId) && productId > 0,
    placeholderData: (previousData) => previousData,
  });
