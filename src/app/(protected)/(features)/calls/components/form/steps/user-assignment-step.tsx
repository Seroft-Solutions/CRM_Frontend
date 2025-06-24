"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../call-form-provider";
import { 
  useGetAllPriorities,
  useSearchPriorities,
  useCountPriorities
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";
import { 
  useGetAllCallTypes,
  useSearchCallTypes,
  useCountCallTypes
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";
import { 
  useGetAllSubCallTypes,
  useSearchSubCallTypes,
  useCountSubCallTypes
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";
import { 
  useGetAllCallCategories,
  useSearchCallCategories,
  useCountCallCategories
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import { 
  useGetAllSources,
  useSearchSources,
  useCountSources
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { 
  useGetAllCustomers,
  useSearchCustomers,
  useCountCustomers
} from "@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen";
import { 
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import { 
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { 
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

// Create hook mapping for dynamic resolution
const hookMapping = {
  // Public Users (built-in user entity)
  // Other entities
  'useGetAllPriorities': useGetAllPriorities,
  'useSearchPriorities': useSearchPriorities,
  'useCountPriorities': useCountPriorities,
  'useGetAllCallTypes': useGetAllCallTypes,
  'useSearchCallTypes': useSearchCallTypes,
  'useCountCallTypes': useCountCallTypes,
  'useGetAllSubCallTypes': useGetAllSubCallTypes,
  'useSearchSubCallTypes': useSearchSubCallTypes,
  'useCountSubCallTypes': useCountSubCallTypes,
  'useGetAllCallCategories': useGetAllCallCategories,
  'useSearchCallCategories': useSearchCallCategories,
  'useCountCallCategories': useCountCallCategories,
  'useGetAllSources': useGetAllSources,
  'useSearchSources': useSearchSources,
  'useCountSources': useCountSources,
  'useGetAllCustomers': useGetAllCustomers,
  'useSearchCustomers': useSearchCustomers,
  'useCountCustomers': useCountCustomers,
  'useGetAllChannelTypes': useGetAllChannelTypes,
  'useSearchChannelTypes': useSearchChannelTypes,
  'useCountChannelTypes': useCountChannelTypes,
  'useGetAllUserProfiles': useGetAllUserProfiles,
  'useSearchUserProfiles': useSearchUserProfiles,
  'useCountUserProfiles': useCountUserProfiles,
  'useGetAllCallStatuses': useGetAllCallStatuses,
  'useSearchCallStatuses': useSearchCallStatuses,
  'useCountCallStatuses': useCountCallStatuses,
};

export function UserAssignmentStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'user'
  );

  if (relationshipsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No user assignment relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">👥 People & Assignment</h3>
        <p className="text-muted-foreground">Assign users and responsibilities</p>
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
