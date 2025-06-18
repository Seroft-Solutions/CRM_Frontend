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



interface AvailableTimeSlotStepUsersProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function AvailableTimeSlotStepUsers({ form, handleEntityCreated }: AvailableTimeSlotStepUsersProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                User
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="email"
                  placeholder="Select user"
                  multiple={false}
                  useGetAllHook={useGetAllUserProfiles}
                  useSearchHook={useSearchUserProfiles}
                  useCountHook={useCountUserProfiles}
                  entityName="UserProfiles"
                  searchField="email"
                  canCreate={true}
                  createEntityPath="/user-profiles/new"
                  createPermission="userProfile:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'user')}
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
