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
  useGetAllParties,
  useSearchParties,
  useCountParties
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";


interface MeetingStepRelationshipsProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function MeetingStepRelationships({ form, handleEntityCreated }: MeetingStepRelationshipsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="assignedParty"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Assigned Party
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select assigned party"
                  multiple={false}
                  useGetAllHook={useGetAllParties}
                  useSearchHook={useSearchParties}
                  useCountHook={useCountParties}
                  entityName="Parties"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/parties/new"
                  createPermission="party:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'assignedParty')}
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
