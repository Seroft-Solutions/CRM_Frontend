"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../meeting-reminder-form-provider";
import { 
  useGetAllMeetings,
  useSearchMeetings,
  useCountMeetings
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";

// Create hook mapping for dynamic resolution
const hookMapping = {
  // Public Users (built-in user entity)
  // User Profiles (UserProfile entity)
  // Other entities
  'useGetAllMeetings': useGetAllMeetings,
  'useSearchMeetings': useSearchMeetings,
  'useCountMeetings': useCountMeetings,
};

export function OtherRelationsStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'other'
  );

  if (relationshipsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No additional relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">🔗 Additional Relations</h3>
        <p className="text-muted-foreground">Other connections and references</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                    onValueChange={field.onChange}
                    displayField={relConfig.displayField}
                    placeholder={relConfig.ui.placeholder}
                    multiple={relConfig.multiple}
                    useGetAllHook={hookMapping[relConfig.api.useGetAllHook as keyof typeof hookMapping]}
                    useSearchHook={hookMapping[relConfig.api.useSearchHook as keyof typeof hookMapping]}
                    useCountHook={relConfig.api.useCountHook ? hookMapping[relConfig.api.useCountHook as keyof typeof hookMapping] : undefined}
                    entityName={relConfig.api.entityName}
                    searchField={relConfig.displayField}
                    canCreate={relConfig.creation.canCreate}
                    createEntityPath={relConfig.creation.createPath || ""}
                    createPermission={relConfig.creation.createPermission || ""}
                    onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
                    disabled={relConfig.ui.disabled}
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
