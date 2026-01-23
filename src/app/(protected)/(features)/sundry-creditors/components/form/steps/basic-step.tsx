'use client';

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { IntelligentLocationField } from '@/app/(protected)/(features)/customers/components/intelligent-location-field';
import { EnhancedProductRelationshipField } from '@/app/(protected)/(features)/products/components/enhanced-product-relationship-field';
import { AddressListField } from '@/components/address-list-field';

interface SundryCreditorBasicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function SundryCreditorBasicStep({ form, config, actions, entity }: SundryCreditorBasicStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}

        {/* Creditor Name Field */}
        <FormField
          control={form.control}
          name="creditorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Creditor Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter creditor name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('creditorName');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email address (example: name@company.com)"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('email');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mobile Field */}
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Mobile
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder="Enter phone number"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    form.setValue('whatsApp', value);
                    form.trigger('mobile');
                    form.trigger('whatsApp');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Whats App Field */}
        <FormField
          control={form.control}
          name="whatsApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                WhatsApp
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder="Enter WhatsApp number"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    form.trigger('whatsApp');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Person Field */}
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Contact Person
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter contact person"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('contactPerson');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      <AddressListField
        form={form}
        name="addresses"
        label="Addresses"
        description="Add one or more addresses and select the default."
      />

      {/* Products Section */}
      <div className="border-t pt-6">
        <div className="border-b pb-2 mb-4">
          <h3 className="text-sm font-medium text-gray-900">Products</h3>
          <p className="text-xs text-gray-500 mt-1">
            Select products supplied by this creditor or create a new one.
          </p>
        </div>

        <FormField
          control={form.control}
          name="products"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Products</FormLabel>
              <FormControl>
                <EnhancedProductRelationshipField
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select products"
                  multiple={true}
                  canCreate={true}
                  createPermission="product:create:inline"
                  onProductCreated={(productId) => {
                    console.log('New product created:', productId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Location Field - Full Width */}
      <div className="border-t pt-6">
        <div className="border-b pb-2 mb-4">
          <h3 className="text-sm font-medium text-gray-900">Location Information</h3>
          <p className="text-xs text-gray-500 mt-1">Search and select sundry creditor location</p>
        </div>

        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Address
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <IntelligentLocationField
                  value={field.value}
                  onChange={field.onChange}
                  onError={(error) => {
                    form.setError('area', { message: error });
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
