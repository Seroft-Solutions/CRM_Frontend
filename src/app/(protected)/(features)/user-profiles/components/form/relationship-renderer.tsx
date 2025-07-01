"use client";

import React from "react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "./paginated-relationship-combobox";

// Import all hooks statically for the specific entity

import {
  useGetAllOrganizations,
  useSearchOrganizations,
  useCountOrganizations,
} from "@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen";
import {
  useGetAllGroups,
  useSearchGroups,
  useCountGroups,
} from "@/core/api/generated/spring/endpoints/group-resource/group-resource.gen";
import {
  useGetAllRoles,
  useSearchRoles,
  useCountRoles,
} from "@/core/api/generated/spring/endpoints/role-resource/role-resource.gen";
import {
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes,
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";

import type { RelationshipConfig } from "./form-types";

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
  config 
}: RelationshipRendererProps) {
  
  // Use hooks based on relationship name - this ensures hooks are called consistently
  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      case 'organizations':
        return (
          <PaginatedRelationshipCombobox
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (relConfig.cascadingFilter) {
                const dependentRelationships = config.relationships.filter((depRel: any) => 
                  depRel.cascadingFilter?.parentField === relConfig.name
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
            createEntityPath={relConfig.creation?.createPath || ""}
            createPermission={relConfig.creation?.createPermission || ""}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
            parentField={relConfig.cascadingFilter?.parentField}
            disabled={
              relConfig.cascadingFilter 
                ? !form.watch(relConfig.cascadingFilter.parentField) 
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );
        
      case 'groups':
        return (
          <PaginatedRelationshipCombobox
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (relConfig.cascadingFilter) {
                const dependentRelationships = config.relationships.filter((depRel: any) => 
                  depRel.cascadingFilter?.parentField === relConfig.name
                );
                dependentRelationships.forEach((depRel: any) => {
                  form.setValue(depRel.name, undefined);
                });
              }
            }}
            displayField={relConfig.displayField}
            placeholder={relConfig.ui.placeholder}
            multiple={relConfig.multiple}
            useGetAllHook={useGetAllGroups}
            useSearchHook={useSearchGroups}
            useCountHook={useCountGroups}
            entityName={relConfig.api.entityName}
            searchField={relConfig.displayField}
            canCreate={relConfig.creation?.canCreate}
            createEntityPath={relConfig.creation?.createPath || ""}
            createPermission={relConfig.creation?.createPermission || ""}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
            parentField={relConfig.cascadingFilter?.parentField}
            disabled={
              relConfig.cascadingFilter 
                ? !form.watch(relConfig.cascadingFilter.parentField) 
                : relConfig.ui.disabled
            }
            {...actions.getNavigationProps(relConfig.name)}
          />
        );
        
      case 'roles':
        return (
          <PaginatedRelationshipCombobox
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (relConfig.cascadingFilter) {
                const dependentRelationships = config.relationships.filter((depRel: any) => 
                  depRel.cascadingFilter?.parentField === relConfig.name
                );
                dependentRelationships.forEach((depRel: any) => {
                  form.setValue(depRel.name, undefined);
                });
              }
            }}
            displayField={relConfig.displayField}
            placeholder={relConfig.ui.placeholder}
            multiple={relConfig.multiple}
            useGetAllHook={useGetAllRoles}
            useSearchHook={useSearchRoles}
            useCountHook={useCountRoles}
            entityName={relConfig.api.entityName}
            searchField={relConfig.displayField}
            canCreate={relConfig.creation?.canCreate}
            createEntityPath={relConfig.creation?.createPath || ""}
            createPermission={relConfig.creation?.createPermission || ""}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
            parentField={relConfig.cascadingFilter?.parentField}
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
                const dependentRelationships = config.relationships.filter((depRel: any) => 
                  depRel.cascadingFilter?.parentField === relConfig.name
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
            createEntityPath={relConfig.creation?.createPath || ""}
            createPermission={relConfig.creation?.createPermission || ""}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
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
        {relConfig.required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      <FormControl>
        {renderRelationshipWithHooks()}
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
