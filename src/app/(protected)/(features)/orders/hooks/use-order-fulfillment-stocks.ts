'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  getGetProductQueryOptions,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  getGetProductVariantQueryOptions,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import type { OrderDetailItem } from '../data/order-data';

type ItemStockSnapshot = {
  availableQuantity: number;
  deliverableQuantity: number;
};

type ProductVariantWithStocks = {
  stockQuantity?: number;
  variantStocks?: Array<{
    stockQuantity?: number;
    warehouse?: {
      id?: number;
    };
  }>;
};

export function useOrderFulfillmentStocks(items: OrderDetailItem[]) {
  const trackedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          typeof item.variantId === 'number' || typeof item.productId === 'number'
      ),
    [items]
  );

  const variantIds = useMemo(
    () =>
      Array.from(
          new Set(
          trackedItems
            .map((item) => item.variantId)
            .filter((id): id is number => typeof id === 'number')
        )
      ),
    [trackedItems]
  );

  const productIds = useMemo(
    () =>
      Array.from(
          new Set(
          trackedItems
            .filter((item) => typeof item.variantId !== 'number')
            .map((item) => item.productId)
            .filter((id): id is number => typeof id === 'number')
        )
      ),
    [trackedItems]
  );

  const variantQueries = useQueries({
    queries: variantIds.map((id) =>
      getGetProductVariantQueryOptions(id, {
        query: {
          enabled: id > 0,
          staleTime: 30_000,
        },
      })
    ),
  });

  const productQueries = useQueries({
    queries: productIds.map((id) =>
      getGetProductQueryOptions(id, {
        query: {
          enabled: id > 0,
          staleTime: 30_000,
        },
      })
    ),
  });

  const stockByItemId = useMemo(() => {
    const variantById = new Map<number, ProductVariantWithStocks | undefined>();
    variantQueries.forEach((query, index) => {
      variantById.set(variantIds[index], query.data as ProductVariantWithStocks | undefined);
    });

    const productStockById = new Map<number, number>();
    productQueries.forEach((query, index) => {
      productStockById.set(productIds[index], Math.max(0, query.data?.stockQuantity ?? 0));
    });

    const nextMap = new Map<number, ItemStockSnapshot>();
    trackedItems.forEach((item) => {
      const totalPendingQuantity = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const availableQuantity =
        typeof item.variantId === 'number'
          ? (() => {
              const variant = variantById.get(item.variantId);

              if (typeof item.warehouseId === 'number' && variant?.variantStocks?.length) {
                const warehouseStock = variant.variantStocks.find(
                  (stock) => stock.warehouse?.id === item.warehouseId
                );

                return Math.max(0, warehouseStock?.stockQuantity ?? 0);
              }

              return variant?.variantStocks?.length
                ? variant.variantStocks.reduce(
                    (sum, stock) => sum + Math.max(0, stock.stockQuantity ?? 0),
                    0
                  )
                : Math.max(0, variant?.stockQuantity ?? 0);
            })()
          : typeof item.productId === 'number'
            ? productStockById.get(item.productId) ?? 0
            : 0;

      nextMap.set(item.orderDetailId, {
        availableQuantity,
        deliverableQuantity: Math.min(availableQuantity, totalPendingQuantity),
      });
    });

    return nextMap;
  }, [trackedItems, productIds, productQueries, variantIds, variantQueries]);

  return {
    stockByItemId,
    isLoading: [...variantQueries, ...productQueries].some((query) => query.isLoading),
  };
}
