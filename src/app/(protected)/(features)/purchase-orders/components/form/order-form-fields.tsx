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
import { OrderStatus, PaymentStatus, ShippingMethod } from '../../data/purchase-order-data';
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
    <div className="grid gap-x-3 gap-y-1 text-[11px] md:grid-cols-3">
      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1 md:col-span-1">
        <Label className="text-[11px] font-semibold text-foreground">Sale Status</Label>
        <div className="min-w-0">
          <Select
            value={formState.orderStatus}
            onValueChange={(value) => onChange('orderStatus', value as OrderStatus)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-border bg-card px-2 py-0 text-[11px] font-normal leading-none text-foreground shadow-none [&>svg]:h-3 [&>svg]:w-3">
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
          <FieldError message={errors.orderStatus} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-foreground">Payment</Label>
        <div className="min-w-0">
          <Select
            value={formState.paymentStatus}
            onValueChange={(value) => onChange('paymentStatus', value as PaymentStatus)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-border bg-card px-2 py-0 text-[11px] font-normal leading-none text-foreground shadow-none [&>svg]:h-3 [&>svg]:w-3">
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
        <Label className="text-[11px] font-semibold text-foreground">Shipping</Label>
        <div className="min-w-0">
          <Select
            value={formState.shippingMethod}
            onValueChange={(value) => onChange('shippingMethod', value)}
          >
            <SelectTrigger className="h-5 min-h-5 w-full rounded-none border-border bg-card px-2 py-0 text-[11px] font-normal leading-none text-foreground shadow-none [&>svg]:h-3 [&>svg]:w-3">
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
        <Label className="text-[11px] font-semibold text-foreground">Shipping Id</Label>
        <div>
          <Input
            placeholder="Tracking / shipment id"
            value={formState.shippingId}
            onChange={(event) => onChange('shippingId', event.target.value)}
            className="h-6 rounded-none border-border bg-card px-2 text-[11px]"
          />
          <FieldError message={errors.shippingId} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1">
        <Label className="text-[11px] font-semibold text-foreground">Shipping Price</Label>
        <div>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={formState.shippingAmount}
            onChange={(event) => onChange('shippingAmount', event.target.value)}
            className="h-6 rounded-none border-border bg-card px-2 text-[11px]"
          />
          <FieldError message={errors.shippingAmount} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-center gap-1 md:col-span-2">
        <Label className="text-[11px] font-semibold text-foreground">Customer</Label>
        <div className="min-w-0">
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
      </div>

      <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)] items-start gap-1 md:col-span-3">
        <Label className="pt-1 text-[11px] font-semibold text-foreground">Comment</Label>
        <Textarea
          placeholder="Internal note for this purchase order..."
          value={formState.orderComment}
          onChange={(event) => onChange('orderComment', event.target.value)}
          className="h-10 min-h-10 resize-none rounded-none border-border bg-card px-2 text-[11px]"
        />
      </div>
    </div>
  );
}
