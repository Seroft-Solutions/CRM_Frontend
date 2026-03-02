'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaginatedRelationshipCombobox } from '@/app/(protected)/(features)/sundry-creditors/components/form/paginated-relationship-combobox';
import { useGetAllSundryCreditors } from '@/core/api/generated/spring/endpoints/sundry-creditor-resource/sundry-creditor-resource.gen';
import {
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
} from '../data/purchase-order-data';
import { FieldError } from './order-form-field-error';
import type { OrderFormErrors, OrderFormState } from './order-form-types';

type OrderFormFieldsProps = {
  formState: OrderFormState;
  errors: OrderFormErrors;
  orderStatusOptions: OrderStatus[];
  paymentStatusOptions: PaymentStatus[];
  shippingMethodOptions: (ShippingMethod | 'Unknown')[];
  onChange: (key: keyof OrderFormState, value: string | boolean) => void;
};

export function OrderFormFields({
  formState,
  errors,
  orderStatusOptions,
  paymentStatusOptions,
  shippingMethodOptions,
  onChange,
}: OrderFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-white/60 px-4 pb-4 pt-0.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Status & Shipping
        </div>
        <div className="grid gap-4 grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Purchase Order Status</Label>
            <Select
              value={formState.orderStatus}
              onValueChange={(value) => onChange('orderStatus', value as OrderStatus)}
            >
              <SelectTrigger className="h-10 w-full border-slate-300">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Payment Status</Label>
            <Select
              value={formState.paymentStatus}
              onValueChange={(value) => onChange('paymentStatus', value as PaymentStatus)}
            >
              <SelectTrigger className="h-10 w-full border-slate-300">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Shipping Method</Label>
            <Select
              value={formState.shippingMethod}
              onValueChange={(value) => onChange('shippingMethod', value)}
            >
              <SelectTrigger className="h-10 w-full border-slate-300">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Shipping Price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={formState.shippingAmount}
              onChange={(event) => onChange('shippingAmount', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.shippingAmount} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Shipping Id</Label>
            <Input
              placeholder="Tracking / shipment id"
              value={formState.shippingId}
              onChange={(event) => onChange('shippingId', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.shippingId} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/60 px-4 pb-4 pt-0.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Sundry Creditor
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Sundry Creditor *</Label>
            <PaginatedRelationshipCombobox
              value={formState.customerId ? Number(formState.customerId) : undefined}
              onValueChange={(value) => onChange('customerId', value ? String(value) : '')}
              placeholder="Select sundry creditor"
              entityName="SundryCreditors"
              displayField="creditorName"
              searchField="creditorName"
              useGetAllHook={useGetAllSundryCreditors}
              canCreate={true}
              createEntityPath="/sundry-creditors/new"
              createPermission="sundry-creditor:create:inline"
            />
            <FieldError message={errors.customerId} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Purchase Order Note</Label>
            <Textarea
              placeholder="Internal note for this purchase order..."
              value={formState.orderComment}
              onChange={(event) => onChange('orderComment', event.target.value)}
              className="h-10 min-h-[40px] resize-none overflow-hidden border-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
