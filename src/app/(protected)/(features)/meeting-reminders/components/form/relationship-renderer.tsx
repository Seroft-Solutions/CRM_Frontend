'use client';

import React, { useCallback } from 'react';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';

import {
  useGetAllMeetings,
  useSearchMeetings,
  useCountMeetings,
} from '@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen';

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
      case 'meeting':
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
            useGetAllHook={useGetAllMeetings}
            useSearchHook={useSearchMeetings}
            useCountHook={useCountMeetings}
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
