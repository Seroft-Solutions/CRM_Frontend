"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../city-form-provider";
import { 
  useGetAllDistricts,
  useSearchDistricts,
  useCountDistricts
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";

export function GeographicStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'geographic'
  );

  // Sort geographic relationships by typical hierarchy (state -> district -> city -> area)
  const sortedRelationships = relationshipsForThisStep.sort((a, b) => {
    const geoOrder = ['state', 'district', 'city', 'area'];
    const aIndex = geoOrder.findIndex(geo => a.name.toLowerCase().includes(geo));
    const bIndex = geoOrder.findIndex(geo => b.name.toLowerCase().includes(geo));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Create hook mappings for the relationships in this step
  const hookMappings = {
    'useGetAllDistricts': useGetAllDistricts,
    'useSearchDistricts': useSearchDistricts,
    'useCountDistricts': useCountDistricts,
  };

  if (sortedRelationships.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No geographic relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">📍 Location Information</h3>
        <p className="text-muted-foreground">Select location details in hierarchical order</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {sortedRelationships.map((relConfig, index) => {
          const parentRel = index > 0 ? sortedRelationships[index - 1] : null;
          
          return (
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
                        
                        // Clear dependent geographic selections
                        for (let j = index + 1; j < sortedRelationships.length; j++) {
                          const dependentRel = sortedRelationships[j];
                          form.setValue(dependentRel.name, undefined, { shouldValidate: false });
                          form.clearErrors(dependentRel.name);
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
                      parentFilter={parentRel ? form.watch(parentRel.name) : undefined}
                      parentField={parentRel?.name}
                      disabled={parentRel ? !form.watch(parentRel.name) : relConfig.ui.disabled}
                      {...actions.getNavigationProps(relConfig.name)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
