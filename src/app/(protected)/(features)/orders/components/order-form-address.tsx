'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from './order-form-field-error';
import type { OrderAddressForm, OrderFormErrors } from './order-form-types';

type OrderFormAddressProps = {
  address: OrderAddressForm;
  errors: OrderFormErrors;
  onAddressChange: (
    section: 'shipTo' | 'billTo',
    key: keyof OrderAddressForm['shipTo'],
    value: string
  ) => void;
  onToggleBillToSame: (checked: boolean) => void;
};

export function OrderFormAddress({
  address,
  errors,
  onAddressChange,
  onToggleBillToSame,
}: OrderFormAddressProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Address Details</h3>
        <p className="text-sm text-muted-foreground">Capture shipping and billing details.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-md border border-dashed border-border p-4">
          <h4 className="text-sm font-semibold text-slate-700">Ship To</h4>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={address.shipTo.firstName}
                onChange={(event) => onAddressChange('shipTo', 'firstName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input
                value={address.shipTo.middleName}
                onChange={(event) => onAddressChange('shipTo', 'middleName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={address.shipTo.lastName}
                onChange={(event) => onAddressChange('shipTo', 'lastName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={address.shipTo.contact}
                onChange={(event) => onAddressChange('shipTo', 'contact', event.target.value)}
              />
              <FieldError message={errors.shipToContact} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Address Line 1</Label>
              <Input
                value={address.shipTo.addrLine1}
                onChange={(event) => onAddressChange('shipTo', 'addrLine1', event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Address Line 2</Label>
              <Input
                value={address.shipTo.addrLine2}
                onChange={(event) => onAddressChange('shipTo', 'addrLine2', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={address.shipTo.city}
                onChange={(event) => onAddressChange('shipTo', 'city', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={address.shipTo.state}
                onChange={(event) => onAddressChange('shipTo', 'state', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Zipcode</Label>
              <Input
                value={address.shipTo.zipcode}
                onChange={(event) => onAddressChange('shipTo', 'zipcode', event.target.value)}
                maxLength={10}
              />
              <FieldError message={errors.shipToZipcode} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={address.shipTo.country}
                onChange={(event) => onAddressChange('shipTo', 'country', event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-dashed border-border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Bill To</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                id="billToSame"
                checked={address.billToSameFlag}
                onCheckedChange={(checked) => onToggleBillToSame(Boolean(checked))}
              />
              <Label htmlFor="billToSame">Same as shipping</Label>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={address.billTo.firstName}
                onChange={(event) => onAddressChange('billTo', 'firstName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input
                value={address.billTo.middleName}
                onChange={(event) => onAddressChange('billTo', 'middleName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={address.billTo.lastName}
                onChange={(event) => onAddressChange('billTo', 'lastName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={address.billTo.contact}
                onChange={(event) => onAddressChange('billTo', 'contact', event.target.value)}
                disabled={address.billToSameFlag}
              />
              <FieldError message={errors.billToContact} />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Address Line 1</Label>
              <Input
                value={address.billTo.addrLine1}
                onChange={(event) => onAddressChange('billTo', 'addrLine1', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label>Address Line 2</Label>
              <Input
                value={address.billTo.addrLine2}
                onChange={(event) => onAddressChange('billTo', 'addrLine2', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={address.billTo.city}
                onChange={(event) => onAddressChange('billTo', 'city', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={address.billTo.state}
                onChange={(event) => onAddressChange('billTo', 'state', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-2">
              <Label>Zipcode</Label>
              <Input
                value={address.billTo.zipcode}
                onChange={(event) => onAddressChange('billTo', 'zipcode', event.target.value)}
                disabled={address.billToSameFlag}
                maxLength={10}
              />
              <FieldError message={errors.billToZipcode} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={address.billTo.country}
                onChange={(event) => onAddressChange('billTo', 'country', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
