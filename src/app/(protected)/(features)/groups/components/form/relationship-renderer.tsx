'use client';

import React from 'react';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PaginatedRelationshipCombobox } from './paginated-relationship-combobox';

// Import all hooks statically for the specific entity

import {
  useGetAllOrganizations,
  useSearchOrganizations,
  useCountOrganizations,
} from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';
import {
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';

import type { RelationshipConfig } from './form-types';

interface RelationshipRendererProps {
  relConfig: RelationshipConfig;
  field: any;
  form: any;
  actions: any;
  config: any;
}

// Generic relationship component that uses hooks based on the relationship name
export function RelationshipRenderer({
  relConfig,
  field,
  form,
  actions,
  config,
}: RelationshipRendererProps) {
  // Use hooks based on relationship name - this ensures hooks are called consistently
  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      case 'organization':
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
            useGetAllHook={useGetAllOrganizations}
            useSearchHook={useSearchOrganizations}
            useCountHook={useCountOrganizations}
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
            disabled={
              relConfig.cascadingFilter
                ? !form.watch(relConfig.cascadingFilter.parentField)
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      case 'members':
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
            disabled={
              relConfig.cascadingFilter
                ? !form.watch(relConfig.cascadingFilter.parentField)
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );

      default:
        // For relationships without proper API configuration, show a fallback message
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
        {relConfig.required && ' *'}
      </FormLabel>
      <FormControl>{renderRelationshipWithHooks()}</FormControl>
      <FormMessage />
    </FormItem>
  );
}
