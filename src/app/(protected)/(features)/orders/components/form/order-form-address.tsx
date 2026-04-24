'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
  shippingEditable: boolean;
  onToggleShippingEditable: (editable: boolean) => void;
};

export function OrderFormAddress({
  address,
  errors,
  onAddressChange,
  onToggleBillToSame,
  shippingEditable,
  onToggleShippingEditable,
}: OrderFormAddressProps) {
  const shipToLocked = !shippingEditable;

  return (
    <div className="space-y-3 border-t border-slate-300 pt-3">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h4 className="text-sm font-bold text-slate-800">Shipping Address</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleShippingEditable(!shippingEditable)}
              className="border-emerald-300 text-xs"
            >
              {shippingEditable ? 'Lock shipping address' : 'Edit shipping address'}
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">First Name</Label>
              <Input
                value={address.shipTo.firstName}
                onChange={(event) => onAddressChange('shipTo', 'firstName', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Middle Name</Label>
              <Input
                value={address.shipTo.middleName}
                onChange={(event) => onAddressChange('shipTo', 'middleName', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name</Label>
              <Input
                value={address.shipTo.lastName}
                onChange={(event) => onAddressChange('shipTo', 'lastName', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact</Label>
              <Input
                value={address.shipTo.contact}
                onChange={(event) => onAddressChange('shipTo', 'contact', event.target.value)}
                disabled={shipToLocked}
              />
              <FieldError message={errors.shipToContact} />
            </div>
            <div className="space-y-1 md:col-span-4">
              <Label className="text-xs">Address Line 1</Label>
              <Input
                value={address.shipTo.addrLine1}
                onChange={(event) => onAddressChange('shipTo', 'addrLine1', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1 md:col-span-4">
              <Label className="text-xs">Address Line 2</Label>
              <Input
                value={address.shipTo.addrLine2}
                onChange={(event) => onAddressChange('shipTo', 'addrLine2', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input
                value={address.shipTo.city}
                onChange={(event) => onAddressChange('shipTo', 'city', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input
                value={address.shipTo.state}
                onChange={(event) => onAddressChange('shipTo', 'state', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zipcode</Label>
              <Input
                value={address.shipTo.zipcode}
                onChange={(event) => onAddressChange('shipTo', 'zipcode', event.target.value)}
                maxLength={10}
                disabled={shipToLocked}
              />
              <FieldError message={errors.shipToZipcode} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
              <Input
                value={address.shipTo.country}
                onChange={(event) => onAddressChange('shipTo', 'country', event.target.value)}
                disabled={shipToLocked}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-300 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <h4 className="text-sm font-bold text-slate-800">Billing Address</h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1">
                <Checkbox
                  id="billToSame"
                  checked={address.billToSameFlag}
                  onCheckedChange={(checked) => onToggleBillToSame(Boolean(checked))}
                  className="border-emerald-500"
                />
                <Label
                  htmlFor="billToSame"
                  className="cursor-pointer text-xs font-semibold text-slate-700"
                >
                  Same as shipping
                </Label>
              </div>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">First Name</Label>
              <Input
                value={address.billTo.firstName}
                onChange={(event) => onAddressChange('billTo', 'firstName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Middle Name</Label>
              <Input
                value={address.billTo.middleName}
                onChange={(event) => onAddressChange('billTo', 'middleName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name</Label>
              <Input
                value={address.billTo.lastName}
                onChange={(event) => onAddressChange('billTo', 'lastName', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact</Label>
              <Input
                value={address.billTo.contact}
                onChange={(event) => onAddressChange('billTo', 'contact', event.target.value)}
                disabled={address.billToSameFlag}
              />
              <FieldError message={errors.billToContact} />
            </div>
            <div className="space-y-1 md:col-span-4">
              <Label className="text-xs">Address Line 1</Label>
              <Input
                value={address.billTo.addrLine1}
                onChange={(event) => onAddressChange('billTo', 'addrLine1', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1 md:col-span-4">
              <Label className="text-xs">Address Line 2</Label>
              <Input
                value={address.billTo.addrLine2}
                onChange={(event) => onAddressChange('billTo', 'addrLine2', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input
                value={address.billTo.city}
                onChange={(event) => onAddressChange('billTo', 'city', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input
                value={address.billTo.state}
                onChange={(event) => onAddressChange('billTo', 'state', event.target.value)}
                disabled={address.billToSameFlag}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zipcode</Label>
              <Input
                value={address.billTo.zipcode}
                onChange={(event) => onAddressChange('billTo', 'zipcode', event.target.value)}
                disabled={address.billToSameFlag}
                maxLength={10}
              />
              <FieldError message={errors.billToZipcode} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
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
