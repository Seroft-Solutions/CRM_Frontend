'use client';

import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { ProductVariantManager } from './ProductVariantManager';

interface ProductVariantManagerWrapperProps {
  productId: number;
}

export function ProductVariantManagerWrapper({ productId }: ProductVariantManagerWrapperProps) {
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="p-8 text-center">Loading variants...</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <ProductVariantManager
        productId={productId}
        productName={product.name}
        variantConfigId={product.variantConfig?.id}
      />
    </div>
  );
}
