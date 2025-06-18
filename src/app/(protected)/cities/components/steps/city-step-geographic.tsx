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
  useGetAllDistricts,
  useSearchDistricts,
  useCountDistricts
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";


interface CityStepGeographicProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function CityStepGeographic({ form, handleEntityCreated }: CityStepGeographicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                District
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear dependent geographic selections
                  }}
                  displayField="name"
                  placeholder="Select district"
                  multiple={false}
                  useGetAllHook={useGetAllDistricts}
                  useSearchHook={useSearchDistricts}
                  useCountHook={useCountDistricts}
                  entityName="Districts"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/districts/new"
                  createPermission="district:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'district')}
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
