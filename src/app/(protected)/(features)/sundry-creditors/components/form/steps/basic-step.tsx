'use client';

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { IntelligentLocationField } from '@/app/(protected)/(features)/customers/components/intelligent-location-field';

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
                {/* Mobile is optional in my schema/config now, so no red asterisk */}
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
                {/* Optional */}
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
                {/* Optional */}
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

        {/* Status Field - Keeping it as input for now based on config, or should validation logic handle it?
            Config says required.
        */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Status
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                {/* Status likely needs a select. reusing input for simple fix as duplicated from customer where it might have been missing in basic step? 
                            Wait, customer basic step code I read lines 19-148, status was NOT there? 
                            It was in config fields though.
                            Check lines 14-106 of customer basic step again.
                            Ah, I missed it? 
                            Lines 19-32: CustomerBusinessName
                            Lines 49-69: Email
                            Lines 72-96: Mobile
                            Lines 99-120: WhatsApp
                            Lines 124-147: Contact Person
                            Location after that.
                            Status is missing in CustomerBasicStep UI!
                            I should add it or maybe it's auto-handled or hidden?
                            In CustomerForm, line 295: status: 'ACTIVE' (hardcoded on create).
                            So status is hidden during creation probably. Makes sense.
                        */}
              </FormControl>
              {/* Im NOT rendering status field if it's auto-handled */}
              <input type="hidden" {...field} />
            </FormItem>
          )}
        />

      </div>

      {/* Location Field - Full Width */}
      <div className="border-t pt-6">
        <div className="border-b pb-2 mb-4">
          <h3 className="text-sm font-medium text-gray-900">Location Information</h3>
          <p className="text-xs text-gray-500 mt-1">Search and select location</p>
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
