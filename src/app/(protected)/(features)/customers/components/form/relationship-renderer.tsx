"use client";

import React from "react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "./paginated-relationship-combobox";

// Import all hooks statically for the specific entity

import {
  useGetAllStates,
  useSearchStates,
  useCountStates,
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import {
  useGetAllDistricts,
  useSearchDistricts,
  useCountDistricts,
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";
import {
  useGetAllCities,
  useSearchCities,
  useCountCities,
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import {
  useGetAllAreas,
  useSearchAreas,
  useCountAreas,
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";

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
      case 'state':
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
            useGetAllHook={useGetAllStates}
            useSearchHook={useSearchStates}
            useCountHook={useCountStates}
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
        
      case 'district':
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
            useGetAllHook={useGetAllDistricts}
            useSearchHook={useSearchDistricts}
            useCountHook={useCountDistricts}
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
        
      case 'city':
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
            useGetAllHook={useGetAllCities}
            useSearchHook={useSearchCities}
            useCountHook={useCountCities}
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
        
      case 'area':
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
            useGetAllHook={useGetAllAreas}
            useSearchHook={useSearchAreas}
            useCountHook={useCountAreas}
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
