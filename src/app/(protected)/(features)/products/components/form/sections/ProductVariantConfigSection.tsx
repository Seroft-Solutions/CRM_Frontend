'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormField } from '@/components/ui/form';
import { Grid3x3, Info } from 'lucide-react';
import { RelationshipRenderer } from '../relationship-renderer';
import { ProductVariantManagerWrapper } from '../../variants/ProductVariantManagerWrapper';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';

interface ProductVariantConfigSectionProps {
  form?: UseFormReturn<Record<string, any>>;
  config?: any;
  actions?: any;
  productId?: number;
  isViewMode?: boolean;
}

export function ProductVariantConfigSection({
  form,
  config,
  actions,
  productId,
  isViewMode = false,
}: ProductVariantConfigSectionProps) {
  const variantConfigRelConfig = config?.relationships?.find(
    (r: any) => r.name === 'variantConfig'
  );

  // Fetch product data for view mode
  const { data: product, isLoading } = useGetProduct(productId || 0, {
    query: { enabled: isViewMode && !!productId },
  });

  const watchedVariantConfigId = form?.watch?.('variantConfig');
  const [helpOpen, setHelpOpen] = React.useState(false);

  if (isViewMode) {
    if (isLoading) {
      return (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Grid3x3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Variant Configuration</h3>
                <p className="text-[10px] text-muted-foreground">Configure product variations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      );
    }

    if (!product) {
      return (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Grid3x3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Variant Configuration</h3>
                <p className="text-[10px] text-muted-foreground">Configure product variations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-sm text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Grid3x3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Variant Configuration</h3>
                <p className="text-[10px] text-muted-foreground">Configure product variations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {/* Variant Config */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Variant Configuration
              </div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.variantConfig?.configKey || 'Not configured'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Variants Section - Only show if product has variants */}
        {product.variants && product.variants.length > 0 && (
          <ProductVariantManagerWrapper productId={productId} />
        )}
      </>
    );
  }

  // If config is not available in non-view mode, show a loading state
  if (!isViewMode && !config) {
    return (
      <>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Grid3x3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Variant Configuration</h3>
                <p className="text-[10px] text-muted-foreground">Configure product variations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-sm text-muted-foreground">Loading configuration...</div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <Grid3x3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Variant Configuration</h3>
              <p className="text-[10px] text-muted-foreground">Configure product variations</p>
            </div>
          </div>
          {/* Collapsible help trigger */}
          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-3 w-3" />
              <span>Help</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute right-4 top-12 z-10 w-72 rounded-md border bg-white p-3 shadow-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a variant configuration if this product has variations (sizes, colors, etc.).
                You can then choose attribute options and generate variant combinations automatically.
                {!productId && ' Save the product first to enable full variant management.'}
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {/* Variant Config Selector */}
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

        {/* Variant Manager - For both new and existing products */}
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
