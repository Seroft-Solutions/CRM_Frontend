'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import { ProductBasicInfoSection } from './sections/ProductBasicInfoSection';
import { ProductPricingSection } from './sections/ProductPricingSection';
import { ProductClassificationSection } from './sections/ProductClassificationSection';
import { ProductVariantConfigSection } from './sections/ProductVariantConfigSection';
import { ProductImagesSidebar } from './sections/ProductImagesSidebar';

interface ProductFormSinglePageProps {
  form: UseFormReturn<Record<string, any>>;
  config: any;
  actions: any;
  entity?: any;
  existingImages?: ProductImageDTO[];
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  productId?: number;
}

export function ProductFormSinglePage({
  form,
  config,
  actions,
  entity,
  existingImages,
  onSubmit,
  onCancel,
  isSubmitting = false,
  productId,
}: ProductFormSinglePageProps) {
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-3">
      {/* Main Form Area - Left */}
      <div className="space-y-3">
        {/* Basic Information Section */}
        <ProductBasicInfoSection form={form} />

        {/* Pricing Section */}
        <ProductPricingSection form={form} />

        {/* Classification Section */}
        <ProductClassificationSection form={form} config={config} actions={actions} />

        {/* Variant Configuration Section */}
        <ProductVariantConfigSection
          form={form}
          config={config}
          actions={actions}
          productId={productId}
        />
      </div>

      {/* Right Sidebar - Images & Actions */}
      <div className="lg:sticky lg:top-6 lg:self-start space-y-3">
        <ProductImagesSidebar
          form={form}
          existingImages={existingImages}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
