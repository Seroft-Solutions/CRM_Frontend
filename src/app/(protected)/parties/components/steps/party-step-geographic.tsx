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
import { 
  useGetAllDistricts,
  useSearchDistricts,
  useCountDistricts
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";
import { 
  useGetAllCities,
  useSearchCities,
  useCountCities
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import { 
  useGetAllAreas,
  useSearchAreas,
  useCountAreas
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";


interface PartyStepGeographicProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function PartyStepGeographic({ form, handleEntityCreated }: PartyStepGeographicProps) {
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
                    form.setValue('district', undefined);
                    form.setValue('city', undefined);
                    form.setValue('area', undefined);
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
                    form.setValue('city', undefined);
                    form.setValue('area', undefined);
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
                  parentFilter={form.watch('state')}
                  parentField="state"
                  disabled={!form.watch('state')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                    form.setValue('area', undefined);
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
                  parentFilter={form.watch('district')}
                  parentField="district"
                  disabled={!form.watch('district')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Area
              </FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear dependent geographic selections
                  }}
                  displayField="name"
                  placeholder="Select area"
                  multiple={false}
                  useGetAllHook={useGetAllAreas}
                  useSearchHook={useSearchAreas}
                  useCountHook={useCountAreas}
                  entityName="Areas"
                  searchField="name"
                  canCreate={true}
                  createEntityPath="/areas/new"
                  createPermission="area:create"
                  onEntityCreated={(entityId) => handleEntityCreated(entityId, 'area')}
                  parentFilter={form.watch('city')}
                  parentField="city"
                  disabled={!form.watch('city')}
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
