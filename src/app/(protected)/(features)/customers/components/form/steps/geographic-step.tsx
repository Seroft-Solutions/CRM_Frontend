'use client';

import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { IntelligentLocationField } from '@/app/(protected)/(features)/customers/components/intelligent-location-field';

interface CustomerGeographicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CustomerGeographicStep({
  form,
  config,
  actions,
  entity,
}: CustomerGeographicStepProps) {
  return (
    <div className="space-y-6">
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
  );
}
