'use client';

import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { ProductVariantManager } from './ProductVariantManager';
import { UseFormReturn } from 'react-hook-form';

interface ProductVariantManagerWrapperProps {
  productId?: number;
  // For create mode when productId is not available
  productName?: string;
  variantConfigId?: number;
  form?: UseFormReturn<Record<string, any>>;
  isViewMode?: boolean;
}

export function ProductVariantManagerWrapper({
  productId,
  productName: providedProductName,
  variantConfigId: providedVariantConfigId,
  form,
  isViewMode = false
}: ProductVariantManagerWrapperProps) {
  const { data: product, isLoading } = useGetProduct(productId!, {
    query: { enabled: !!productId },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading variants...
      </div>
    );
  }

  // For edit mode: use fetched product data
  // For create mode: use provided props
  const productName = product?.name ?? providedProductName ?? 'Product';
  const variantConfigId = product?.variantConfig?.id ?? providedVariantConfigId;

  if (!variantConfigId) return null;

  return (
    <ProductVariantManager
      productId={productId}
      productName={productName}
      variantConfigId={variantConfigId}
      form={form}
      isViewMode={isViewMode}
    />
  );
}
