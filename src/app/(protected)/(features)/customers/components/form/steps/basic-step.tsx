// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { IntelligentLocationField } from '@/app/(protected)/(features)/customers/components/intelligent-location-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerBasicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CustomerBasicStep({ form, config, actions, entity }: CustomerBasicStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}

        {/* Customer Business Name Field */}
        <FormField
          control={form.control}
          name="customerBusinessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Customer Business Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter customer business name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('customerBusinessName');
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
              <FormLabel className="text-sm font-medium">
                Email
              </FormLabel>
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

      {/* Location Field - Full Width */}
      <div className="border-t pt-6">
        <div className="border-b pb-2 mb-4">
          <h3 className="text-sm font-medium text-gray-900">Location Information</h3>
          <p className="text-xs text-gray-500 mt-1">Search and select customer location</p>
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
