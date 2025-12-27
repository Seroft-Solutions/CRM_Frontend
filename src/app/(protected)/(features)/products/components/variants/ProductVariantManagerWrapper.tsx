'use client';

import { ProductVariantManager } from './ProductVariantManager';
import { UseFormReturn } from 'react-hook-form';

interface ProductVariantManagerWrapperProps {
  productId?: number;
  // For create mode when productId is not available
  productName?: string;
  variantConfigId?: number;
  form?: UseFormReturn<Record<string, unknown>>;
  isViewMode?: boolean;
}

export function ProductVariantManagerWrapper({
  productId,
  productName: providedProductName,
  variantConfigId: providedVariantConfigId,
  form,
  isViewMode = false,
}: ProductVariantManagerWrapperProps) {
  const productName = providedProductName ?? 'Product';
  const variantConfigId = providedVariantConfigId;

  if (!variantConfigId) {
    return null;
  }

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
