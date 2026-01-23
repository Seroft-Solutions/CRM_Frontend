'use client';

import React from 'react';
import { AddressListField } from '@/components/address-list-field';

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
        <h3 className="text-sm font-medium text-gray-900">Customer Addresses</h3>
      </div>

      <AddressListField
        form={form}
        name="addresses"
        label="Addresses"
        description="Add one or more addresses and select the default."
        showLocationFields
      />
    </div>
  );
}
