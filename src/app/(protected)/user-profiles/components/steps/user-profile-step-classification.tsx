"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";


import { 
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";


interface UserProfileStepClassificationProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function UserProfileStepClassification({ form, handleEntityCreated }: UserProfileStepClassificationProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="channelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Channel Type
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  displayField="name"
                  placeholder="Select channel type"
                  multiple={false}
                  useGetAllHook={useGetAllChannelTypes}
                  useSearchHook={useSearchChannelTypes}
                  useCountHook={useCountChannelTypes}
                  entityName="ChannelTypes"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/channel-types/new"
                  createPermission="channelType:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'channelType')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
