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
    <div className="border-t border-slate-300 pt-2">
      <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-700">Shipping Address</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleShippingEditable(!shippingEditable)}
              className="h-6 rounded-none border-slate-400 px-2 text-[11px]"
            >
              {shippingEditable ? 'Lock' : 'Edit'}
            </Button>
          </div>
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-2">
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">First</Label>
              <Input
                value={address.shipTo.firstName}
                onChange={(event) => onAddressChange('shipTo', 'firstName', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Middle</Label>
              <Input
                value={address.shipTo.middleName}
                onChange={(event) => onAddressChange('shipTo', 'middleName', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Last</Label>
              <Input
                value={address.shipTo.lastName}
                onChange={(event) => onAddressChange('shipTo', 'lastName', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Contact</Label>
              <Input
                value={address.shipTo.contact}
                onChange={(event) => onAddressChange('shipTo', 'contact', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
              <FieldError message={errors.shipToContact} />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1 md:col-span-2">
              <Label className="text-[11px]">Address 1</Label>
              <Input
                value={address.shipTo.addrLine1}
                onChange={(event) => onAddressChange('shipTo', 'addrLine1', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1 md:col-span-2">
              <Label className="text-[11px]">Address 2</Label>
              <Input
                value={address.shipTo.addrLine2}
                onChange={(event) => onAddressChange('shipTo', 'addrLine2', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">City</Label>
              <Input
                value={address.shipTo.city}
                onChange={(event) => onAddressChange('shipTo', 'city', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">State</Label>
              <Input
                value={address.shipTo.state}
                onChange={(event) => onAddressChange('shipTo', 'state', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Zipcode</Label>
              <Input
                value={address.shipTo.zipcode}
                onChange={(event) => onAddressChange('shipTo', 'zipcode', event.target.value)}
                maxLength={10}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
              <FieldError message={errors.shipToZipcode} />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Country</Label>
              <Input
                value={address.shipTo.country}
                onChange={(event) => onAddressChange('shipTo', 'country', event.target.value)}
                disabled={shipToLocked}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-700">Billing Address</h4>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-6 items-center gap-2 bg-emerald-50 px-2">
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
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-2">
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">First</Label>
              <Input
                value={address.billTo.firstName}
                onChange={(event) => onAddressChange('billTo', 'firstName', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Middle</Label>
              <Input
                value={address.billTo.middleName}
                onChange={(event) => onAddressChange('billTo', 'middleName', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Last</Label>
              <Input
                value={address.billTo.lastName}
                onChange={(event) => onAddressChange('billTo', 'lastName', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Contact</Label>
              <Input
                value={address.billTo.contact}
                onChange={(event) => onAddressChange('billTo', 'contact', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
              <FieldError message={errors.billToContact} />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1 md:col-span-2">
              <Label className="text-[11px]">Address 1</Label>
              <Input
                value={address.billTo.addrLine1}
                onChange={(event) => onAddressChange('billTo', 'addrLine1', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1 md:col-span-2">
              <Label className="text-[11px]">Address 2</Label>
              <Input
                value={address.billTo.addrLine2}
                onChange={(event) => onAddressChange('billTo', 'addrLine2', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">City</Label>
              <Input
                value={address.billTo.city}
                onChange={(event) => onAddressChange('billTo', 'city', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">State</Label>
              <Input
                value={address.billTo.state}
                onChange={(event) => onAddressChange('billTo', 'state', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Zipcode</Label>
              <Input
                value={address.billTo.zipcode}
                onChange={(event) => onAddressChange('billTo', 'zipcode', event.target.value)}
                disabled={address.billToSameFlag}
                maxLength={10}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
              <FieldError message={errors.billToZipcode} />
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-1">
              <Label className="text-[11px]">Country</Label>
              <Input
                value={address.billTo.country}
                onChange={(event) => onAddressChange('billTo', 'country', event.target.value)}
                disabled={address.billToSameFlag}
                className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
