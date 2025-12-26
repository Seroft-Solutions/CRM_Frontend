'use client';

import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';
import { useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';

import {
  useCountProductCategories,
  useGetAllProductCategories,
  useSearchProductCategories,
} from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import {
  useCountProductSubCategories,
  useGetAllProductSubCategories,
  useSearchProductSubCategories,
} from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import {
  useCountSystemConfigs,
  useGetAllSystemConfigs,
  useSearchSystemConfigs,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';

import type { RelationshipConfig } from './form-types';
import type {
  SystemConfigAttributeDTO,
} from '@/core/api/generated/spring/schemas';

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
  const selectedValue = useWatch({ control: form.control, name: relConfig.name as any }) as unknown;

  const isVariantConfig = relConfig.name === 'variantConfig';
  const selectedVariantConfigId =
    isVariantConfig && typeof selectedValue === 'number' ? selectedValue : undefined;

  const { data: variantAttributes = [], isLoading: isLoadingVariantAttributes } =
    useGetAllSystemConfigAttributes(
      {
        'systemConfigId.equals': selectedVariantConfigId,
        page: 0,
        size: 1000,
        sort: ['sortOrder,asc'],
      },
      {
        query: {
          enabled: Boolean(selectedVariantConfigId),
          staleTime: 60_000,
        },
      }
    );

  const attributeIds = React.useMemo(() => {
    return (variantAttributes ?? [])
      .map((attr) => attr.id)
      .filter((id): id is number => typeof id === 'number');
  }, [variantAttributes]);

  const renderVariantAttributePreview = React.useCallback(() => {
    if (!selectedVariantConfigId) return null;

    if (isLoadingVariantAttributes) {
      return (
        <div className="text-xs text-muted-foreground">Loading config attributes…</div>
      );
    }

    const attributes = variantAttributes ?? [];
    if (!attributes.length) {
      return (
        <div className="text-xs text-muted-foreground">
          No attributes found for this variant configuration.
        </div>
      );
    }

    const sorted = [...attributes].sort((a, b) => {
      const reqA = Boolean((a as any).isRequired);
      const reqB = Boolean((b as any).isRequired);
      if (reqA !== reqB) return reqA ? -1 : 1;
      const labelA = (a.label || a.name || '').toLowerCase();
      const labelB = (b.label || b.name || '').toLowerCase();
      return labelA.localeCompare(labelB);
    });

    return (
      <div className="flex flex-wrap gap-2">
        {sorted.map((attr) => {
          const label = attr.label || attr.name || `Attribute #${attr.id}`;
          const required = Boolean((attr as any).isRequired);

          return (
            <Badge
              key={attr.id ?? label}
              variant={required ? 'destructive' : 'secondary'}
              className="text-[11px] font-medium"
            >
              {label}
            </Badge>
          );
        })}
      </div>
    );
  }, [
    attributeIds.length,
    isLoadingVariantAttributes,
    selectedVariantConfigId,
    variantAttributes,
  ]);

  const handleDataLoaded = React.useCallback(
    (relationshipName: string, data: any[]) => {
      const autoPopulateRelationships = config.relationships.filter(
        (rel: any) => rel.autoPopulate?.sourceField === relationshipName
      );

      autoPopulateRelationships.forEach((targetRel: any) => {
        const sourceValue = form.getValues(relationshipName);
        if (sourceValue && data.length > 0) {
          const selectedItem = data.find((item: any) => item.id === sourceValue);
          if (selectedItem) {
            const sourceProperty = targetRel.autoPopulate.sourceProperty;
            const targetField = targetRel.autoPopulate.targetField;

            const relatedValue = selectedItem[sourceProperty];
            const valueToPopulate =
              typeof relatedValue === 'object' ? relatedValue.id : relatedValue;

            if (valueToPopulate !== undefined) {
              const currentTargetValue = form.getValues(targetField);
              const shouldPopulate = targetRel.autoPopulate.allowOverride || !currentTargetValue;

              if (shouldPopulate && currentTargetValue !== valueToPopulate) {
                setTimeout(() => {
                  form.setValue(targetField, valueToPopulate);
                }, 0);
              }
            }
          }
        }
      });
    },
    [form, config]
  );

  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      case 'category':
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
                  form.setValue(depRel.name, undefined);
                });
              }
            }}
            displayField={relConfig.displayField}
            placeholder={relConfig.ui.placeholder}
            multiple={relConfig.multiple}
            useGetAllHook={useGetAllProductCategories}
            useSearchHook={useSearchProductCategories}
            useCountHook={useCountProductCategories}
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
            onDataLoaded={(data) => handleDataLoaded(relConfig.name, data)}
            disabled={
              relConfig.cascadingFilter
                ? !form.watch(relConfig.cascadingFilter.parentField)
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      case 'subCategory':
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
                  form.setValue(depRel.name, undefined);
                });
              }
            }}
            displayField={relConfig.displayField}
            placeholder={relConfig.ui.placeholder}
            multiple={relConfig.multiple}
            useGetAllHook={useGetAllProductSubCategories}
            useSearchHook={useSearchProductSubCategories}
            useCountHook={useCountProductSubCategories}
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
            onDataLoaded={(data) => handleDataLoaded(relConfig.name, data)}
            disabled={
              relConfig.cascadingFilter
                ? !form.watch(relConfig.cascadingFilter.parentField)
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      case 'variantConfig':
        return (
          <div className="space-y-2">
            <PaginatedRelationshipCombobox
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (relConfig.cascadingFilter) {
                  const dependentRelationships = config.relationships.filter(
                    (depRel: any) => depRel.cascadingFilter?.parentField === relConfig.name
                  );
                  dependentRelationships.forEach((depRel: any) => {
                    form.setValue(depRel.name, undefined);
                  });
                }
              }}
              displayField={relConfig.displayField}
              placeholder={relConfig.ui.placeholder}
              multiple={relConfig.multiple}
              useGetAllHook={useGetAllSystemConfigs}
              useSearchHook={useSearchSystemConfigs}
              useCountHook={useCountSystemConfigs}
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
              onDataLoaded={(data) => handleDataLoaded(relConfig.name, data)}
              disabled={
                relConfig.cascadingFilter
                  ? !form.watch(relConfig.cascadingFilter.parentField)
                  : relConfig.ui.disabled
              }
              helpText={(relConfig.ui as any).helpText}
              {...actions.getNavigationProps(relConfig.name)}
            />
            {renderVariantAttributePreview()}
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
