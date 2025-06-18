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
  useGetAllCities,
  useSearchCities,
  useCountCities
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";


interface AreaStepGeographicProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function AreaStepGeographic({ form, handleEntityCreated }: AreaStepGeographicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                City
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear dependent geographic selections
                  }}
                  displayField="name"
                  placeholder="Select city"
                  multiple={false}
                  useGetAllHook={useGetAllCities}
                  useSearchHook={useSearchCities}
                  useCountHook={useCountCities}
                  entityName="Cities"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/cities/new"
                  createPermission="city:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'city')}
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
