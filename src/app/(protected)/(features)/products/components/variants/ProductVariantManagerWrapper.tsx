'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProductVariantManager } from './ProductVariantManager';
import { VariantTableSelection } from './product-variant-manager/types';

interface ProductVariantManagerWrapperProps {
  productId?: number;
  productName?: string;
  variantConfigId?: number;
  variantIdsFilter?: number[];
  form?: UseFormReturn<Record<string, unknown>>;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
}

export function ProductVariantManagerWrapper({
  productId,
  productName: providedProductName,
  variantConfigId: providedVariantConfigId,
  variantIdsFilter,
  form,
  isViewMode = false,
  selection,
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
      variantIdsFilter={variantIdsFilter}
      form={form}
      isViewMode={isViewMode}
      selection={selection}
    />
  );
}
