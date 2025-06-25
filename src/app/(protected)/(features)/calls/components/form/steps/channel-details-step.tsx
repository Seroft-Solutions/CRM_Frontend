"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useEntityForm } from "../call-form-provider";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";

// Import the API hooks
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

// Create hook mapping for dynamic resolution
const hookMapping = {
  'useGetAllChannelTypes': useGetAllChannelTypes,
  'useSearchChannelTypes': useSearchChannelTypes,
  'useCountChannelTypes': useCountChannelTypes,
  'useGetAllUserProfiles': useGetAllUserProfiles,
  'useSearchUserProfiles': useSearchUserProfiles,
  'useCountUserProfiles': useCountUserProfiles,
};

export function ChannelDetailsStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'channel'
  );

  if (relationshipsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No channel relationships configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">📞 Channel Details</h3>
        <p className="text-muted-foreground">Channel type and parties</p>
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
                  {relConfig.ui.icon} {relConfig.ui.label}
                  {relConfig.required && " *"}
                </FormLabel>
                <FormControl>
                  <PaginatedRelationshipCombobox
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Handle entity creation callback
                      if (value && typeof value === 'number' && relConfig.creation?.canCreate) {
                        actions.handleEntityCreated(value, relConfig.name);
                      }
                    }}
                    displayField={relConfig.displayField}
                    placeholder={relConfig.ui.placeholder}
                    multiple={relConfig.multiple}
                    useGetAllHook={hookMapping[relConfig.api.useGetAllHook as keyof typeof hookMapping]}
                    useSearchHook={hookMapping[relConfig.api.useSearchHook as keyof typeof hookMapping]}
                    useCountHook={hookMapping[relConfig.api.useCountHook as keyof typeof hookMapping]}
                    entityName={relConfig.api.entityName}
                    canCreate={relConfig.creation?.canCreate}
                    createEntityPath={relConfig.creation?.createPath}
                    createPermission={relConfig.creation?.createPermission}
                    onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
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
