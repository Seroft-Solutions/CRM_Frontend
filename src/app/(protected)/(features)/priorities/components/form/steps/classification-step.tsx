"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../priority-form-provider";

export function ClassificationStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'classification'
  );

  // Create hook mappings for the relationships in this step
  const hookMappings = {
  };

  if (relationshipsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No classification relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">🏷️ Classification</h3>
        <p className="text-muted-foreground">Set priority, status, and categories</p>
      </div>
      
      <div className={`grid ${config.ui.responsive.mobile} ${config.ui.responsive.tablet} ${config.ui.responsive.desktop} ${config.ui.spacing.fieldGap}`}>
        {relationshipsForThisStep.map((relConfig) => (
          <FormField
            key={relConfig.name}
            control={form.control}
            name={relConfig.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {relConfig.ui.label}
                  {relConfig.required && " *"}
                </FormLabel>
                <FormControl>
                  <PaginatedRelationshipCombobox
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      
                      // Handle cascading filters (e.g., callType -> subCallType)
                      if (relConfig.cascadingFilter) {
                        // Clear dependent fields when parent changes
                        const dependentRelationships = config.relationships.filter(depRel => 
                          depRel.cascadingFilter?.parentField === relConfig.name
                        );
                        
                        dependentRelationships.forEach(depRel => {
                          form.setValue(depRel.name, undefined);
                        });
                      }
                    }}
                    displayField={relConfig.displayField}
                    placeholder={relConfig.ui.placeholder}
                    multiple={relConfig.multiple}
                    useGetAllHook={hookMappings[relConfig.api.useGetAllHook as keyof typeof hookMappings]}
                    useSearchHook={hookMappings[relConfig.api.useSearchHook as keyof typeof hookMappings]}
                    useCountHook={relConfig.api.useCountHook ? hookMappings[relConfig.api.useCountHook as keyof typeof hookMappings] : undefined}
                    entityName={relConfig.api.entityName}
                    searchField={relConfig.displayField}
                    canCreate={relConfig.creation.canCreate}
                    createEntityPath={relConfig.creation.createPath || ""}
                    createPermission={relConfig.creation.createPermission || ""}
                    onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
                    onEntitiesLoaded={(entityType, entities) => actions.registerLoadedEntities(entityType, entities)}
                    parentFilter={relConfig.cascadingFilter ? form.watch(relConfig.cascadingFilter.parentField) : undefined}
                    parentField={relConfig.cascadingFilter?.parentField}
                    disabled={
                      relConfig.cascadingFilter 
                        ? !form.watch(relConfig.cascadingFilter.parentField) 
                        : relConfig.ui.disabled
                    }
                    {...actions.getNavigationProps(relConfig.name)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
