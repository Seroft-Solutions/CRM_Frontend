'use client';

import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormField } from '@/components/ui/form';
import { FolderTree } from 'lucide-react';
import { RelationshipRenderer } from '../relationship-renderer';
import { ProductVariantManagerWrapper } from '../../variants/ProductVariantManagerWrapper';
import type { ProductDTO } from '@/core/api/generated/spring/schemas';
import type { FormActions, FormConfig } from '../form-types';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

const DEFAULT_VARIANT_CONFIG_KEY = 'product.variant.basic';

interface ProductClassificationSectionProps {
  form?: UseFormReturn<Record<string, unknown>>;
  config?: FormConfig;
  actions?: FormActions;
  isViewMode?: boolean;
  product?: ProductDTO | null;
  productId?: number;
}

export function ProductClassificationSection({
  form,
  config,
  actions,
  isViewMode = false,
  product,
  productId,
}: ProductClassificationSectionProps) {
  const categoryRelConfig = config?.relationships?.find((r) => r.name === 'category');
  const subCategoryRelConfig = config?.relationships?.find((r) => r.name === 'subCategory');
  const variantConfigRelConfig = config?.relationships?.find((r) => r.name === 'variantConfig');
  const watchedVariantConfigId = form?.watch?.('variantConfig');

  const shouldSetDefaultVariantConfig =
    Boolean(form) && !isViewMode && !productId && !form?.getValues?.('variantConfig');
  const { data: defaultVariantConfigs = [] } = useGetAllSystemConfigs(
    {
      'configKey.equals': DEFAULT_VARIANT_CONFIG_KEY,
      'status.equals': 'ACTIVE',
      size: 1,
    },
    {
      query: { enabled: shouldSetDefaultVariantConfig },
    }
  );

  useEffect(() => {
    if (!shouldSetDefaultVariantConfig || !form) return;
    const defaultConfig = defaultVariantConfigs[0];
    if (defaultConfig?.id) {
      form.setValue('variantConfig', defaultConfig.id, { shouldValidate: true });
    }
  }, [defaultVariantConfigs, form, shouldSetDefaultVariantConfig]);

  if (isViewMode) {
    if (!product) {
      return (
        <Card className="border shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <FolderTree className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Classification</h3>
                <p className="text-[10px] text-muted-foreground">Categorize your product</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-sm text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <FolderTree className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Classification</h3>
              <p className="text-[10px] text-muted-foreground">Categorize your product</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {/* Category */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Category</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.category?.name || 'Not selected'}
              </div>
            </div>

            {/* Sub Category */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Sub Category</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.subCategory?.name || 'Not selected'}
              </div>
            </div>

            {/* Variant Configuration */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Variant Configuration</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.variantConfig?.configKey || DEFAULT_VARIANT_CONFIG_KEY}
              </div>
            </div>
          </div>

          {product.variantConfig?.id && (
            <div className="pt-2">
              <ProductVariantManagerWrapper
                productId={productId}
                productName={product.name || 'Product'}
                variantConfigId={product.variantConfig.id}
                isViewMode={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If config is not available in non-view mode, show a loading state
  if (!isViewMode && !config) {
    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Classification</h3>
              <p className="text-[10px] text-muted-foreground">Categorize your product</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-sm text-muted-foreground">Loading configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <FolderTree className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Classification</h3>
            <p className="text-[10px] text-muted-foreground">Categorize your product</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-3">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Category */}
          {categoryRelConfig && form && config && actions && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <RelationshipRenderer
                  relConfig={categoryRelConfig}
                  field={field}
                  form={form}
                  actions={actions}
                  config={config}
                />
              )}
            />
          )}

          {/* Sub Category */}
          {subCategoryRelConfig && form && config && actions && (
            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <RelationshipRenderer
                  relConfig={subCategoryRelConfig}
                  field={field}
                  form={form}
                  actions={actions}
                  config={config}
                />
              )}
            />
          )}

          {/* Variant Configuration */}
          {variantConfigRelConfig && form && config && actions && (
            <FormField
              control={form.control}
              name="variantConfig"
              render={({ field }) => (
                <RelationshipRenderer
                  relConfig={variantConfigRelConfig}
                  field={field}
                  form={form}
                  actions={actions}
                  config={config}
                />
              )}
            />
          )}

          {/* Status field intentionally hidden; defaults to ACTIVE on submission */}
        </div>

        {watchedVariantConfigId && form && (
          <div className="pt-2">
            <ProductVariantManagerWrapper
              productId={productId}
              productName={form.watch('name') || 'Product'}
              variantConfigId={watchedVariantConfigId}
              form={form}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
