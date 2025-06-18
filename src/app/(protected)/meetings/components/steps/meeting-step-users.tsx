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
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";



interface MeetingStepUsersProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function MeetingStepUsers({ form, handleEntityCreated }: MeetingStepUsersProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="organizer"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Organizer
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="email"
                  placeholder="Select organizer"
                  multiple={false}
                  useGetAllHook={useGetAllUserProfiles}
                  useSearchHook={useSearchUserProfiles}
                  useCountHook={useCountUserProfiles}
                  entityName="UserProfiles"
                  searchField="email"
                  canCreate={true}
                  createEntityPath="/user-profiles/new"
                  createPermission="userProfile:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'organizer')}
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
