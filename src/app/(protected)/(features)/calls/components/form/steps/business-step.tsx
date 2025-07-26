// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipRenderer } from "../relationship-renderer";

interface CallBusinessStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallBusinessStep({ form, config, actions }: CallBusinessStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Generated Relationship Fields */}
        
        {/* Source Relationship */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'source',
                type: 'many-to-one',
                targetEntity: 'source',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllSources',
                  useSearchHook: 'useSearchSources',
                  useCountHook: 'useCountSources',
                  entityName: 'Sources',
                },
                creation: {
                  canCreate: true,
                  createPath: '/sources/new',
                  createPermission: 'source:create:inline',
                },
                ui: {
                  label: 'Source',
                  placeholder: 'Select source',
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
        
        {/* Customer Relationship */}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'customer',
                type: 'many-to-one',
                targetEntity: 'customer',
                displayField: 'customerBusinessName',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllCustomers',
                  useSearchHook: 'useSearchCustomers',
                  useCountHook: 'useCountCustomers',
                  entityName: 'Customers',
                },
                creation: {
                  canCreate: true,
                  createPath: '/customers/new',
                  createPermission: 'customer:create:inline',
                },
                ui: {
                  label: 'Customer',
                  placeholder: 'Select customer',
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
        
        {/* Product Relationship */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'product',
                type: 'many-to-one',
                targetEntity: 'product',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllProducts',
                  useSearchHook: 'useSearchProducts',
                  useCountHook: 'useCountProducts',
                  entityName: 'Products',
                },
                creation: {
                  canCreate: true,
                  createPath: '/products/new',
                  createPermission: 'product:create:inline',
                },
                ui: {
                  label: 'Product',
                  placeholder: 'Select product',
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
