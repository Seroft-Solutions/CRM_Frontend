// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced business step with integrated call remarks functionality
// - Allows adding remarks that are saved when call is created
// - Added business partner filtering for customers by createdBy
// ===============================================================
'use client';

import React, { useMemo } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RelationshipRenderer } from '../relationship-renderer';
import { EnhancedCustomerRelationshipField } from '@/app/(protected)/(features)/customers/components/enhanced-customer-relationship-field';
import { EnhancedProductRelationshipField } from '@/app/(protected)/(features)/products/components/enhanced-product-relationship-field';
import { useUserAuthorities } from '@/core/auth';
import { useAccount } from '@/core/auth';

interface CallBusinessStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CallBusinessStep({ form, config, actions, entity }: CallBusinessStepProps) {
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');

  // Create custom filters for customer relationship based on user group
  const customerCustomFilters = useMemo(() => {
    if (isBusinessPartner && accountData?.login) {
      // For business partners, only show customers created by them
      return {
        'createdBy.equals': accountData.login,
      };
    }
    // For non-business partners, show all customers
    return {};
  }, [isBusinessPartner, accountData?.login]);
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
                ui: { label: 'Source', placeholder: 'Select source', icon: '🏢' },
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />

        {/* Customer Relationship - Enhanced with inline sheet creation */}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Customer
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <EnhancedCustomerRelationshipField
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select customer"
                  canCreate={true}
                  createPermission="customer:create:inline"
                  customFilters={customerCustomFilters}
                  onCustomerCreated={(customerId) => {
                    // Optionally trigger any additional actions when customer is created
                    console.log('New customer created:', customerId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Relationship - Enhanced with inline sheet creation */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Product
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <EnhancedProductRelationshipField
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select product"
                  canCreate={true}
                  createPermission="product:create:inline"
                  onProductCreated={(productId) => {
                    // Optionally trigger any additional actions when product is created
                    console.log('New product created:', productId);
                  }}
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
