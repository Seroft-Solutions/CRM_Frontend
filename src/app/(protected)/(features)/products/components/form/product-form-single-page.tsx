'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { FormActions, FormConfig } from './form-types';
import { ProductBasicInfoSection } from './sections/ProductBasicInfoSection';
import { ProductClassificationSection } from './sections/ProductClassificationSection';
import { ProductFormActions } from './sections/ProductFormActions';

interface ProductFormSinglePageProps {
  form: UseFormReturn<Record<string, unknown>>;
  config: FormConfig;
  actions: FormActions;
  entity?: unknown;
  onCancel: () => void;
  isSubmitting?: boolean;
  productId?: number;
}

export function ProductFormSinglePage({
  form,
  config,
  actions,
  onCancel,
  isSubmitting = false,
  productId,
}: ProductFormSinglePageProps) {
  return (
    <div className="space-y-3">
      {/* Basic Information Section */}
      <ProductBasicInfoSection form={form} />

      {/* Classification Section */}
      <ProductClassificationSection
        form={form}
        config={config}
        actions={actions}
        productId={productId}
      />

      <ProductFormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </div>
  );
}
