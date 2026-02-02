'use client';

import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductVariantManager } from './ProductVariantManager';
import { VariantTableSelection } from './product-variant-manager/types';

interface ProductVariantManagerWrapperProps {
  productId?: number;
  // For create mode when productId is not available
  productName?: string;
  variantConfigId?: number;
  form?: UseFormReturn<Record<string, unknown>>;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
}

export function ProductVariantManagerWrapper({
  productId,
  productName: providedProductName,
  variantConfigId: providedVariantConfigId,
  form,
  isViewMode = false,
  selection,
}: ProductVariantManagerWrapperProps) {
  const productName = providedProductName ?? 'Product';
  const variantConfigId = providedVariantConfigId;
  const salePriceRaw = form?.watch?.('salePrice');
  const defaultVariantPrice = useMemo(() => {
    const parsed =
      salePriceRaw !== undefined && salePriceRaw !== null && String(salePriceRaw).trim() !== ''
        ? Number(salePriceRaw)
        : undefined;

    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [salePriceRaw]);

  if (!variantConfigId) {
    return null;
  }

  return (
    <ProductVariantManager
      productId={productId}
      productName={productName}
      variantConfigId={variantConfigId}
      form={form}
      defaultVariantPrice={defaultVariantPrice}
      isViewMode={isViewMode}
      selection={selection}
    />
  );
}
