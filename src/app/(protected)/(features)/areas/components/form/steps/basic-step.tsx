'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IntelligentCityField } from '../../intelligent-city-field';

interface AreaBasicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function AreaBasicStep({ form, config, actions, entity }: AreaBasicStepProps) {
  return (
    <div className="space-y-6">
      {/* All fields in a single row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* City Selection */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                City
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <IntelligentCityField
                  value={field.value}
                  onChange={field.onChange}
                  onError={(error) => {
                    form.setError('city', { message: error });
                  }}
                  placeholder="Search city..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Area Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Area Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter area name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('name');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pincode Field */}
        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Pincode
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('pincode');
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
