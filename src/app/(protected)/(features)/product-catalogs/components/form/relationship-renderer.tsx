'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';
import {
  useCountProducts,
  useGetAllProducts,
  useGetProduct,
  useSearchProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  useGetAllProductVariants,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { ProductVariantManagerWrapper } from '@/app/(protected)/(features)/products/components/variants/ProductVariantManagerWrapper';

import type { RelationshipConfig } from './form-types';

interface RelationshipRendererProps {
  relConfig: RelationshipConfig;
  field: any;
  form: any;
  actions: any;
  config: any;
}

export function RelationshipRenderer({
  relConfig,
  field,
  form,
  actions,
  config,
}: RelationshipRendererProps) {
  const isVariantsField = relConfig.name === 'variants';
  const productId = useWatch({ control: form.control, name: 'product' });
  const previousProductId = useRef<number | undefined>();
  const autoSelectedProductId = useRef<number | null>(null);

  useEffect(() => {
    if (previousProductId.current !== undefined && previousProductId.current !== productId) {
      form.setValue('variants', []);
      form.setValue('image', '');
      autoSelectedProductId.current = null;
    }
    previousProductId.current = productId;
  }, [productId, form]);

  const { data: productData } = useGetProduct(productId ?? 0, {
    query: {
      enabled: !!productId,
    },
  });

  const { data: variantsData, isLoading: isLoadingVariants } = useGetAllProductVariants(
    productId
      ? {
          'productId.equals': productId,
          size: 1000,
          sort: ['sku,asc'],
        }
      : undefined,
    {
      query: {
        enabled: !!productId,
      },
    }
  );

  const variants = useMemo(() => {
    if (!variantsData) return [];
    return Array.isArray(variantsData)
      ? variantsData
      : variantsData.content
        ? variantsData.content
        : variantsData.data
          ? variantsData.data
          : [];
  }, [variantsData]);

  const selectedVariantIds = isVariantsField && Array.isArray(field.value) ? field.value : [];
  const allSelected = variants.length > 0 && selectedVariantIds.length === variants.length;

  const handleVariantToggle = (variantId: number, checked: boolean) => {
    if (!isVariantsField) {
      return;
    }
    const updated = checked
      ? [...selectedVariantIds, variantId]
      : selectedVariantIds.filter((id: number) => id !== variantId);
    field.onChange(updated);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!isVariantsField) {
      return;
    }
    if (!checked) {
      field.onChange([]);
      return;
    }
    const variantIds = variants
      .map((variant: any) => variant.id)
      .filter((id: number | undefined) => typeof id === 'number');
    field.onChange(variantIds);
  };

  useEffect(() => {
    if (!isVariantsField) {
      return;
    }

    if (!productId) {
      autoSelectedProductId.current = null;
      return;
    }

    if (autoSelectedProductId.current === productId) {
      return;
    }

    if (variants.length === 0) {
      return;
    }

    if (selectedVariantIds.length > 0) {
      autoSelectedProductId.current = productId;
      return;
    }

    handleSelectAll(true);
    autoSelectedProductId.current = productId;
  }, [productId, variants, selectedVariantIds]);

  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      case 'product':
        return (
          <PaginatedRelationshipCombobox
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (relConfig.cascadingFilter) {
                const dependentRelationships = config.relationships.filter(
                  (depRel: any) => depRel.cascadingFilter?.parentField === relConfig.name
                );
                dependentRelationships.forEach((depRel: any) => {
                  form.setValue(depRel.name, relConfig.multiple ? [] : undefined);
                });
              }
            }}
            displayField={relConfig.displayField}
            placeholder={relConfig.ui.placeholder}
            multiple={relConfig.multiple}
            useGetAllHook={useGetAllProducts}
            useSearchHook={useSearchProducts}
            useCountHook={useCountProducts}
            entityName={relConfig.api.entityName}
            searchField={relConfig.displayField}
            canCreate={relConfig.creation?.canCreate}
            createEntityPath={relConfig.creation?.createPath || ''}
            createPermission={relConfig.creation?.createPermission || ''}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={
              relConfig.cascadingFilter
                ? form.watch(relConfig.cascadingFilter.parentField)
                : undefined
            }
            parentField={relConfig.cascadingFilter?.parentField}
            customFilters={relConfig.customFilters}
            disabled={relConfig.ui.disabled}
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      case 'variants':
        if (!productId) {
          return (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
              Select a product to load its variants.
            </div>
          );
        }

        if (isLoadingVariants) {
          return (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
              Loading variants...
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {variants.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                No variants available for the selected product.
              </div>
            ) : null}

            <div className="pt-2">
              {productData?.variantConfig?.id ? (
                <ProductVariantManagerWrapper
                  productId={productId}
                  productName={productData?.name || 'Product'}
                  variantConfigId={productData?.variantConfig?.id}
                  isViewMode={true}
                  selection={{
                    isRowSelected: (item) => {
                      if (item.kind !== 'existing') return false;
                      return selectedVariantIds.includes(item.row.id);
                    },
                    onRowToggle: (item, checked) => {
                      if (item.kind !== 'existing') return;
                      handleVariantToggle(item.row.id, checked);
                    },
                    isAllSelected: allSelected,
                    onToggleAll: handleSelectAll,
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                  Variant table is unavailable for this product.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-muted-foreground text-sm p-4 border border-dashed rounded">
            Relationship configuration incomplete for: {relConfig.name}
            <br />
            <small>API hooks not defined in form config</small>
          </div>
        );
    }
  };

  return (
    <FormItem>
      <FormLabel className="text-sm font-medium">
        {relConfig.ui.label}
        {relConfig.required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      <FormControl>{renderRelationshipWithHooks()}</FormControl>
      <FormMessage />
    </FormItem>
  );
}
