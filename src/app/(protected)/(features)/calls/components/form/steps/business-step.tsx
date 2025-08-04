// ===============================================================
// 🛑 MANUALLY GENERATED FILE - SAFE TO EDIT 🛑
// - Enhanced business step with integrated call remarks functionality
// - Allows adding remarks that are saved when call is created
// - Added business partner filtering for customers by createdBy
// ===============================================================
"use client";

import React, { useMemo } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { Separator } from "@/components/ui/separator";

import { RelationshipRenderer } from "@/app/(protected)/(features)/calls/components/form/relationship-renderer";
import { useUserAuthorities } from '@/core/auth';
import { useAccount } from '@/core/auth';


interface CallBusinessStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallBusinessStep({ form, config, actions }: CallBusinessStepProps) {
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');

  // Create custom filters for customer relationship based on user group
  const customerCustomFilters = useMemo(() => {
    if (isBusinessPartner && accountData?.login) {
      // For business partners, only show customers created by them
      return {
        "createdBy.equals": accountData.login
      };
    }
    // For non-business partners, show all customers
    return {};
  }, [isBusinessPartner, accountData?.login]);






  return (
    <div className="space-y-6">
      {/* Business Relationships */}
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
                api: {"useGetAllHook":"useGetAllSources","useSearchHook":"useSearchSources","useCountHook":"useCountSources","entityName":"Sources"},
                creation: {"canCreate":true,"createPath":"/sources/new","createPermission":"source:create:inline"},
                ui: {"label":"Source","placeholder":"Select source","icon":"🏢"},
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Customer Relationship - with business partner filtering */}
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
                customFilters: customerCustomFilters,
                api: {"useGetAllHook":"useGetAllCustomers","useSearchHook":"useSearchCustomers","useCountHook":"useCountCustomers","entityName":"Customers"},
                creation: {"canCreate":true,"createPath":"/customers/new","createPermission":"customer:create:inline"},
                ui: {"label":"Customer","placeholder":"Select customer","icon":"🏢"},
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
                api: {"useGetAllHook":"useGetAllProducts","useSearchHook":"useSearchProducts","useCountHook":"useCountProducts","entityName":"Products"},
                creation: {"canCreate":true,"createPath":"/products/new","createPermission":"product:create:inline"},
                ui: {"label":"Product","placeholder":"Select product","icon":"🏢"},
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
      </div>

      {/* Call Remarks Section */}

    </div>
  );
}
