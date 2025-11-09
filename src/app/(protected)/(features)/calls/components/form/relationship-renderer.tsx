'use client';

import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';

import {
  useCountPriorities,
  useGetAllPriorities,
  useSearchPriorities,
} from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';
import {
  useCountCallTypes,
  useGetAllCallTypes,
  useSearchCallTypes,
} from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import {
  useCountSubCallTypes,
  useGetAllSubCallTypes,
  useSearchSubCallTypes,
} from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';
import {
  useCountSources,
  useGetAllSources,
  useSearchSources,
} from '@/core/api/generated/spring/endpoints/source-resource/source-resource.gen';
import {
  useCountCustomers,
  useGetAllCustomers,
  useSearchCustomers,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import {
  useCountProducts,
  useGetAllProducts,
  useSearchProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  useCountChannelTypes,
  useGetAllChannelTypes,
  useSearchChannelTypes,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import {
  useCountUserProfiles,
  useGetAllUserProfiles,
  useSearchUserProfiles,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import {
  useCountCallStatuses,
  useGetAllCallStatuses,
  useSearchCallStatuses,
} from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';

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
      case 'priority':
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
            useGetAllHook={useGetAllPriorities}
            useSearchHook={useSearchPriorities}
            useCountHook={useCountPriorities}
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

      case 'callType':
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
            useGetAllHook={useGetAllCallTypes}
            useSearchHook={useSearchCallTypes}
            useCountHook={useCountCallTypes}
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

      case 'subCallType':
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
            useGetAllHook={useGetAllSubCallTypes}
            useSearchHook={useSearchSubCallTypes}
            useCountHook={useCountSubCallTypes}
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

      case 'source':
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
            useGetAllHook={useGetAllSources}
            useSearchHook={useSearchSources}
            useCountHook={useCountSources}
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

      case 'customer':
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
            useGetAllHook={useGetAllCustomers}
            useSearchHook={useSearchCustomers}
            useCountHook={useCountCustomers}
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
                  form.setValue(depRel.name, undefined);
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
            onDataLoaded={(data) => handleDataLoaded(relConfig.name, data)}
            disabled={
              relConfig.cascadingFilter
                ? !form.watch(relConfig.cascadingFilter.parentField)
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      case 'channelType':
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
            useGetAllHook={useGetAllChannelTypes}
            useSearchHook={useSearchChannelTypes}
            useCountHook={useCountChannelTypes}
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

      case 'channelParties':
      case 'assignedTo':
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
            useGetAllHook={useGetAllUserProfiles}
            useSearchHook={useSearchUserProfiles}
            useCountHook={useCountUserProfiles}
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

      case 'assignedTo':
      case 'channelParties':
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
            useGetAllHook={useGetAllUserProfiles}
            useSearchHook={useSearchUserProfiles}
            useCountHook={useCountUserProfiles}
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

      case 'callStatus':
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
            useGetAllHook={useGetAllCallStatuses}
            useSearchHook={useSearchCallStatuses}
            useCountHook={useCountCallStatuses}
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
