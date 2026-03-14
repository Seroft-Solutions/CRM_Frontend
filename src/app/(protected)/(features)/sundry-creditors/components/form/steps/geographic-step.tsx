'use client';

import React from 'react';
import { AddressListField } from '@/components/address-list-field';

interface SundryCreditorGeographicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function SundryCreditorGeographicStep({
  form,
  config,
  actions,
  entity,
}: SundryCreditorGeographicStepProps) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-2 mb-4">
        <h3 className="text-sm font-medium text-gray-900">Location Information</h3>
        <p className="text-xs text-gray-500 mt-1">Add one or more locations for this creditor</p>
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
