"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipRenderer } from "../relationship-renderer";

interface CustomerGeographicStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CustomerGeographicStep({ form, config, actions }: CustomerGeographicStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Generated Relationship Fields */}
        
        {/* State Relationship */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'state',
                type: 'many-to-one',
                targetEntity: 'state',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllStates',
                  useSearchHook: 'useSearchStates',
                  useCountHook: 'useCountStates',
                  entityName: 'States',
                },
                creation: {
                  canCreate: true,
                  createPath: '/states/new',
                  createPermission: 'state:create',
                },
                ui: {
                  label: 'State',
                  placeholder: 'Select state',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* District Relationship */}
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'district',
                type: 'many-to-one',
                targetEntity: 'district',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllDistricts',
                  useSearchHook: 'useSearchDistricts',
                  useCountHook: 'useCountDistricts',
                  entityName: 'Districts',
                },
                creation: {
                  canCreate: true,
                  createPath: '/districts/new',
                  createPermission: 'district:create',
                },
                ui: {
                  label: 'District',
                  placeholder: 'Select district',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* City Relationship */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'city',
                type: 'many-to-one',
                targetEntity: 'city',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllCitys',
                  useSearchHook: 'useSearchCitys',
                  useCountHook: 'useCountCitys',
                  entityName: 'Citys',
                },
                creation: {
                  canCreate: true,
                  createPath: '/citys/new',
                  createPermission: 'city:create',
                },
                ui: {
                  label: 'City',
                  placeholder: 'Select city',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Area Relationship */}
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'area',
                type: 'many-to-one',
                targetEntity: 'area',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllAreas',
                  useSearchHook: 'useSearchAreas',
                  useCountHook: 'useCountAreas',
                  entityName: 'Areas',
                },
                creation: {
                  canCreate: true,
                  createPath: '/areas/new',
                  createPermission: 'area:create',
                },
                ui: {
                  label: 'Area',
                  placeholder: 'Select area',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
      </div>
    </div>
  );
}
