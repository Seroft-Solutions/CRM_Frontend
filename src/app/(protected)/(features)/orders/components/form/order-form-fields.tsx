'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EnhancedCustomerRelationshipField } from '@/app/(protected)/(features)/customers/components/enhanced-customer-relationship-field';
import { OrderStatus, PaymentStatus, ShippingMethod } from '../../data/order-data';
import { FieldError } from './order-form-field-error';
import type { OrderFormErrors, OrderFormState } from './order-form-types';

type OrderFormFieldsProps = {
  formState: OrderFormState;
  errors: OrderFormErrors;
  orderStatusOptions: OrderStatus[];
  paymentStatusOptions: PaymentStatus[];
  shippingMethodOptions: (ShippingMethod | 'Unknown')[];
  onChange: (key: keyof OrderFormState, value: string | boolean) => void;
  onVerifyDiscount: () => void;
};

export function OrderFormFields({
  formState,
  errors,
  orderStatusOptions,
  paymentStatusOptions,
  shippingMethodOptions,
  onChange,
  onVerifyDiscount,
}: OrderFormFieldsProps) {
  return (
    <div className="grid gap-x-3 gap-y-1 text-[11px] md:grid-cols-3">
      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1 md:col-span-1">
        <Label className="text-[11px] font-semibold text-slate-700">Sale Type</Label>
        <div className="min-w-0">
          <Select
            value={formState.orderStatus}
            onValueChange={(value) => onChange('orderStatus', value as OrderStatus)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-slate-400 bg-[#ffffcc] px-2 py-0 text-[11px] font-normal leading-none text-slate-900 shadow-none [&>svg]:h-3 [&>svg]:w-3">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {orderStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-slate-700">Payment</Label>
        <div className="min-w-0">
          <Select
            value={formState.paymentStatus}
            onValueChange={(value) => onChange('paymentStatus', value as PaymentStatus)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-slate-400 bg-[#ffffcc] px-2 py-0 text-[11px] font-normal leading-none text-slate-900 shadow-none [&>svg]:h-3 [&>svg]:w-3">
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-slate-700">Discount</Label>
        <div>
          <div className="flex gap-1">
            <Input
              placeholder="PROMO2024"
              value={formState.discountCode}
              onChange={(event) => onChange('discountCode', event.target.value)}
              className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
            />
            <Button
              type="button"
              size="sm"
              className="h-6 rounded-none bg-blue-700 px-2 text-[11px] text-white hover:bg-blue-800"
              onClick={onVerifyDiscount}
            >
              Verify
            </Button>
          </div>
          <FieldError message={errors.discountCode} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-slate-700">Shipping</Label>
        <div className="min-w-0">
          <Select
            value={formState.shippingMethod}
            onValueChange={(value) => onChange('shippingMethod', value)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-slate-400 bg-[#ffffcc] px-2 py-0 text-[11px] font-normal leading-none text-slate-900 shadow-none [&>svg]:h-3 [&>svg]:w-3">
              <SelectValue placeholder="Pick a method" />
            </SelectTrigger>
            <SelectContent>
              {shippingMethodOptions.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-slate-700">Shipping Id</Label>
        <div>
          <Input
            placeholder="Tracking / shipment id"
            value={formState.shippingId}
            onChange={(event) => onChange('shippingId', event.target.value)}
            className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
          />
          <FieldError message={errors.shippingId} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-slate-700">Shipping Price</Label>
        <div>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={formState.shippingAmount}
            onChange={(event) => onChange('shippingAmount', event.target.value)}
            className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px]"
          />
          <FieldError message={errors.shippingAmount} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_170px_86px_minmax(0,1fr)] items-center gap-1 md:col-span-3">
        <Label className="text-[11px] font-semibold text-slate-700">Party Name</Label>
        <div className="min-w-0">
          <EnhancedCustomerRelationshipField
            value={formState.customerId ? Number(formState.customerId) : undefined}
            onValueChange={(value) => onChange('customerId', value ? String(value) : '')}
            placeholder="Select customer"
            canCreate={true}
            createPermission="customer:create:inline"
            className="h-6 rounded-none border-slate-400 bg-[#ffffcc] px-2 text-[11px] text-slate-900"
            buttonClassName="h-6 w-6 rounded-none border-blue-700 bg-blue-700 p-0 hover:border-blue-800 hover:bg-blue-800"
          />
          <FieldError message={errors.customerId} />
        </div>
        <Label className="pt-1 text-[11px] font-semibold text-slate-700">Narration</Label>
        <div>
          <Textarea
            placeholder="Internal note for this order..."
            value={formState.orderComment}
            onChange={(event) => onChange('orderComment', event.target.value)}
            className="h-8 min-h-[32px] resize-none overflow-hidden rounded-none border-slate-400 bg-[#ffffcc] px-2 py-1 text-[11px]"
          />
        </div>
      </div>
    </div>
  );
}
