'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';
import {
  useCountProducts,
  useGetAllProducts,
  useSearchProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  useGetAllProductVariants,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';

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
  const productId = useWatch({ control: form.control, name: 'product' });
  const previousProductId = useRef<number | undefined>();

  useEffect(() => {
    if (previousProductId.current !== undefined && previousProductId.current !== productId) {
      form.setValue('variants', []);
    }
    previousProductId.current = productId;
  }, [productId, form]);

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

  const selectedVariantIds = Array.isArray(field.value) ? field.value : [];
  const allSelected = variants.length > 0 && selectedVariantIds.length === variants.length;

  const handleVariantToggle = (variantId: number, checked: boolean) => {
    const updated = checked
      ? [...selectedVariantIds, variantId]
      : selectedVariantIds.filter((id: number) => id !== variantId);
    field.onChange(updated);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      field.onChange([]);
      return;
    }
    const variantIds = variants
      .map((variant: any) => variant.id)
      .filter((id: number | undefined) => typeof id === 'number');
    field.onChange(variantIds);
  };

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

        if (variants.length === 0) {
          return (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
              No variants available for the selected product.
            </div>
          );
        }

        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={allSelected} onCheckedChange={(value) => handleSelectAll(!!value)} />
              Select all variants
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {variants.map((variant: any) => (
                <label key={variant.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedVariantIds.includes(variant.id)}
                    onCheckedChange={(value) => handleVariantToggle(variant.id, !!value)}
                  />
                  <span>{variant.sku || `Variant ${variant.id}`}</span>
                </label>
              ))}
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
