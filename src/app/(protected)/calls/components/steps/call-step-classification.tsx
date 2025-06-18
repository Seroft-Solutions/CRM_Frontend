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


interface CallStepClassificationProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function CallStepClassification({ form, handleEntityCreated }: CallStepClassificationProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Priority
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  displayField="name"
                  placeholder="Select priority"
                  multiple={false}
                  useGetAllHook={useGetAllPriorities}
                  useSearchHook={useSearchPriorities}
                  useCountHook={useCountPriorities}
                  entityName="Priorities"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/priorities/new"
                  createPermission="priority:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'priority')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Call Type
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  displayField="name"
                  placeholder="Select call type"
                  multiple={false}
                  useGetAllHook={useGetAllCallTypes}
                  useSearchHook={useSearchCallTypes}
                  useCountHook={useCountCallTypes}
                  entityName="CallTypes"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/call-types/new"
                  createPermission="callType:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callType')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subCallType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Sub Call Type
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear subCallType when callType changes
                    if ('subCallType' === 'callType') {
                      form.setValue('subCallType', undefined);
                    }
                  }}
                  displayField="name"
                  placeholder="Select sub call type"
                  multiple={false}
                  useGetAllHook={useGetAllSubCallTypes}
                  useSearchHook={useSearchSubCallTypes}
                  useCountHook={useCountSubCallTypes}
                  entityName="SubCallTypes"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/sub-call-types/new"
                  createPermission="subCallType:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'subCallType')}
                  parentFilter={form.watch('callType')}
                  parentField="callType"
                  disabled={!form.watch('callType')}
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
        <FormField
          control={form.control}
          name="callCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Call Category
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  displayField="name"
                  placeholder="Select call category"
                  multiple={false}
                  useGetAllHook={useGetAllCallCategories}
                  useSearchHook={useSearchCallCategories}
                  useCountHook={useCountCallCategories}
                  entityName="CallCategories"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/call-categories/new"
                  createPermission="callCategory:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callCategory')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Call Status
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  displayField="name"
                  placeholder="Select call status"
                  multiple={false}
                  useGetAllHook={useGetAllCallStatuses}
                  useSearchHook={useSearchCallStatuses}
                  useCountHook={useCountCallStatuses}
                  entityName="CallStatuses"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/call-statuses/new"
                  createPermission="callStatus:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callStatus')}
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
