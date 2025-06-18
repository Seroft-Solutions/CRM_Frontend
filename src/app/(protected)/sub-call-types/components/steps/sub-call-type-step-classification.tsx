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
  useGetAllCallTypes,
  useSearchCallTypes,
  useCountCallTypes
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";


interface SubCallTypeStepClassificationProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function SubCallTypeStepClassification({ form, handleEntityCreated }: SubCallTypeStepClassificationProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
      </div>
    </div>
  );
}
