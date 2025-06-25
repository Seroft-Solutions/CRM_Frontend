"use client";

import React from "react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "./paginated-relationship-combobox";

// Import all hooks statically for the specific entity

import {
  useGetAllPriorities,
  useSearchPriorities,
  useCountPriorities,
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";
import {
  useGetAllCallTypes,
  useSearchCallTypes,
  useCountCallTypes,
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";
import {
  useGetAllSubCallTypes,
  useSearchSubCallTypes,
  useCountSubCallTypes,
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";
import {
  useGetAllCallCategories,
  useSearchCallCategories,
  useCountCallCategories,
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import {
  useGetAllSources,
  useSearchSources,
  useCountSources,
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import {
  useGetAllCustomers,
  useSearchCustomers,
  useCountCustomers,
} from "@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen";
import {
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes,
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import {
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import {
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses,
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

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
      case 'priority':
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
            useGetAllHook={useGetAllPriorities}
            useSearchHook={useSearchPriorities}
            useCountHook={useCountPriorities}
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
        
      case 'callType':
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
            useGetAllHook={useGetAllCallTypes}
            useSearchHook={useSearchCallTypes}
            useCountHook={useCountCallTypes}
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
        
      case 'subCallType':
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
            useGetAllHook={useGetAllSubCallTypes}
            useSearchHook={useSearchSubCallTypes}
            useCountHook={useCountSubCallTypes}
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
        
      case 'callCategory':
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
            useGetAllHook={useGetAllCallCategories}
            useSearchHook={useSearchCallCategories}
            useCountHook={useCountCallCategories}
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
        
      case 'source':
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
            useGetAllHook={useGetAllSources}
            useSearchHook={useSearchSources}
            useCountHook={useCountSources}
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
        
      case 'customer':
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
            useGetAllHook={useGetAllCustomers}
            useSearchHook={useSearchCustomers}
            useCountHook={useCountCustomers}
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
        
      case 'channelParties':
      case 'assignedTo':
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
            useGetAllHook={useGetAllUserProfiles}
            useSearchHook={useSearchUserProfiles}
            useCountHook={useCountUserProfiles}
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
        
      case 'assignedTo':
      case 'channelParties':
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
            useGetAllHook={useGetAllUserProfiles}
            useSearchHook={useSearchUserProfiles}
            useCountHook={useCountUserProfiles}
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
        
      case 'callStatus':
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
            useGetAllHook={useGetAllCallStatuses}
            useSearchHook={useSearchCallStatuses}
            useCountHook={useCountCallStatuses}
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
        {relConfig.required && " *"}
      </FormLabel>
      <FormControl>
        {renderRelationshipWithHooks()}
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
