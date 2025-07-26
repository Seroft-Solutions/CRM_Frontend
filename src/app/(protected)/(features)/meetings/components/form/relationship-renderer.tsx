// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React, { useCallback } from "react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "./paginated-relationship-combobox";

// Import all hooks statically for the specific entity

import {
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import {
  useGetAllCustomers,
  useSearchCustomers,
  useCountCustomers,
} from "@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen";
import {
  useGetAllCalls,
  useSearchCalls,
  useCountCalls,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";

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
  
  // Handle data loading for auto-population
  const handleDataLoaded = React.useCallback((relationshipName: string, data: any[]) => {
    // Find relationships that should auto-populate from this field
    const autoPopulateRelationships = config.relationships.filter((rel: any) => 
      rel.autoPopulate?.sourceField === relationshipName
    );
    
    autoPopulateRelationships.forEach((targetRel: any) => {
      const sourceValue = form.getValues(relationshipName);
      if (sourceValue && data.length > 0) {
        // Find the selected source item
        const selectedItem = data.find((item: any) => item.id === sourceValue);
        if (selectedItem) {
          const sourceProperty = targetRel.autoPopulate.sourceProperty;
          const targetField = targetRel.autoPopulate.targetField;
          
          // Get the value to populate
          const relatedValue = selectedItem[sourceProperty];
          const valueToPopulate = typeof relatedValue === 'object' ? relatedValue.id : relatedValue;
          
          if (valueToPopulate !== undefined) {
            // Check if the target field is empty or should be overwritten
            const currentTargetValue = form.getValues(targetField);
            const shouldPopulate = targetRel.autoPopulate.allowOverride || !currentTargetValue;
            
            if (shouldPopulate && currentTargetValue !== valueToPopulate) {
              // Use setTimeout to avoid infinite loops
              setTimeout(() => {
                form.setValue(targetField, valueToPopulate);
              }, 0);
            }
          }
        }
      }
    });
  }, [form, config]);
  
  // Use hooks based on relationship name - this ensures hooks are called consistently
  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      case 'organizer':
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
        
      case 'assignedCustomer':
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
        
      case 'call':
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
            useGetAllHook={useGetAllCalls}
            useSearchHook={useSearchCalls}
            useCountHook={useCountCalls}
            entityName={relConfig.api.entityName}
            searchField={relConfig.displayField}
            canCreate={relConfig.creation?.canCreate}
            createEntityPath={relConfig.creation?.createPath || ""}
            createPermission={relConfig.creation?.createPermission || ""}
            onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
            parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
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
