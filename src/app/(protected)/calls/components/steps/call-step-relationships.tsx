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
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { 
  useGetAllParties,
  useSearchParties,
  useCountParties
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";


interface CallStepRelationshipsProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function CallStepRelationships({ form, handleEntityCreated }: CallStepRelationshipsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Source
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select source"
                  multiple={false}
                  useGetAllHook={useGetAllSources}
                  useSearchHook={useSearchSources}
                  useCountHook={useCountSources}
                  entityName="Sources"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/sources/new"
                  createPermission="source:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'source')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  onValueChange={field.onChange}
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
        <FormField
          control={form.control}
          name="channelParty"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Channel Party
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="email"
                  placeholder="Select channel party"
                  multiple={false}
                  useGetAllHook={useGetAllUserProfiles}
                  useSearchHook={useSearchUserProfiles}
                  useCountHook={useCountUserProfiles}
                  entityName="UserProfiles"
                  searchField="email"
                  canCreate={true}
                  createEntityPath="/user-profiles/new"
                  createPermission="userProfile:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'channelParty')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Party
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select party"
                  multiple={false}
                  useGetAllHook={useGetAllParties}
                  useSearchHook={useSearchParties}
                  useCountHook={useCountParties}
                  entityName="Parties"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/parties/new"
                  createPermission="party:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'party')}
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
