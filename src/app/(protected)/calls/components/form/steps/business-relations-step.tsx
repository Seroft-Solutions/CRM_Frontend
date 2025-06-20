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
  useGetAllSources,
  useSearchSources,
  useCountSources
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { 
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import { 
  useGetAllCallCategories,
  useSearchCallCategories,
  useCountCallCategories
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import { 
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";
import { 
  useGetAllStates,
  useSearchStates,
  useCountStates
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import { 
  useGetAllDistricts,
  useSearchDistricts,
  useCountDistricts
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";
import { 
  useGetAllCities,
  useSearchCities,
  useCountCities
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import { 
  useGetAllAreas,
  useSearchAreas,
  useCountAreas
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";
import { 
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { 
  useGetAllParties,
  useSearchParties,
  useCountParties
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";

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
  'useGetAllSources': useGetAllSources,
  'useSearchSources': useSearchSources,
  'useCountSources': useCountSources,
  'useGetAllChannelTypes': useGetAllChannelTypes,
  'useSearchChannelTypes': useSearchChannelTypes,
  'useCountChannelTypes': useCountChannelTypes,
  'useGetAllCallCategories': useGetAllCallCategories,
  'useSearchCallCategories': useSearchCallCategories,
  'useCountCallCategories': useCountCallCategories,
  'useGetAllCallStatuses': useGetAllCallStatuses,
  'useSearchCallStatuses': useSearchCallStatuses,
  'useCountCallStatuses': useCountCallStatuses,
  'useGetAllStates': useGetAllStates,
  'useSearchStates': useSearchStates,
  'useCountStates': useCountStates,
  'useGetAllDistricts': useGetAllDistricts,
  'useSearchDistricts': useSearchDistricts,
  'useCountDistricts': useCountDistricts,
  'useGetAllCities': useGetAllCities,
  'useSearchCities': useSearchCities,
  'useCountCities': useCountCities,
  'useGetAllAreas': useGetAllAreas,
  'useSearchAreas': useSearchAreas,
  'useCountAreas': useCountAreas,
  'useGetAllUserProfiles': useGetAllUserProfiles,
  'useSearchUserProfiles': useSearchUserProfiles,
  'useCountUserProfiles': useCountUserProfiles,
  'useGetAllParties': useGetAllParties,
  'useSearchParties': useSearchParties,
  'useCountParties': useCountParties,
};

export function BusinessRelationsStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'business'
  );

  if (relationshipsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No business relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">🏢 Business Relations</h3>
        <p className="text-muted-foreground">Connect with customers, products, and sources</p>
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
