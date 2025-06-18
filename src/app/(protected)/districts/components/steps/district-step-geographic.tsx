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
  useGetAllStates,
  useSearchStates,
  useCountStates
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";


interface DistrictStepGeographicProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function DistrictStepGeographic({ form, handleEntityCreated }: DistrictStepGeographicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                State
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear dependent geographic selections
                  }}
                  displayField="name"
                  placeholder="Select state"
                  multiple={false}
                  useGetAllHook={useGetAllStates}
                  useSearchHook={useSearchStates}
                  useCountHook={useCountStates}
                  entityName="States"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/states/new"
                  createPermission="state:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'state')}
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
