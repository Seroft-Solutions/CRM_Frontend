'use client';

import React from 'react';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import { ProductBasicInfoSection } from './form/sections/ProductBasicInfoSection';
import { ProductPricingSection } from './form/sections/ProductPricingSection';
import { ProductClassificationSection } from './form/sections/ProductClassificationSection';
import { ProductVariantConfigSection } from './form/sections/ProductVariantConfigSection';
import { ProductImagesSidebar } from './form/sections/ProductImagesSidebar';

interface ProductViewFormProps {
  id: number;
}

export function ProductViewForm({ id }: ProductViewFormProps) {
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-3">
      {/* Main Form Area - Left */}
      <div className="space-y-3">
        {/* Basic Information Section */}
        <ProductBasicInfoSection isViewMode={true} productId={id} />

        {/* Pricing Section */}
        <ProductPricingSection isViewMode={true} productId={id} />

        {/* Classification Section */}
        <ProductClassificationSection
          isViewMode={true}
          productId={id}
        />

        {/* Variant Configuration Section */}
        <ProductVariantConfigSection
          productId={id}
          isViewMode={true}
        />
      </div>

      {/* Right Sidebar - Images & Actions */}
      <div className="lg:sticky lg:top-6 lg:self-start space-y-3">
        <ProductImagesSidebar
          existingImages={[] as ProductImageDTO[]}
          onSubmit={() => {}}
          onCancel={() => {}}
          isSubmitting={false}
          isViewMode={true}
          productId={id}
        />
      </div>
    </div>
  );
}