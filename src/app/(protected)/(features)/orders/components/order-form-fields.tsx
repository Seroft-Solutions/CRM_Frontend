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
import {
  DiscountType,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
  UserType,
} from '../data/order-data';
import { FieldError } from './order-form-field-error';
import type { OrderFormErrors, OrderFormState } from './order-form-types';

type OrderFormFieldsProps = {
  formState: OrderFormState;
  errors: OrderFormErrors;
  orderStatusOptions: OrderStatus[];
  paymentStatusOptions: PaymentStatus[];
  userTypeOptions: UserType[];
  shippingMethodOptions: (ShippingMethod | 'Unknown')[];
  discountTypeOptions: (DiscountType | 'Unknown')[];
  notificationTypeOptions: (NotificationType | 'Unknown')[];
  onChange: (key: keyof OrderFormState, value: string | boolean) => void;
};

export function OrderFormFields({
  formState,
  errors,
  orderStatusOptions,
  paymentStatusOptions,
  userTypeOptions,
  shippingMethodOptions,
  discountTypeOptions,
  notificationTypeOptions,
  onChange,
}: OrderFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-white/60 p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
          Status & Type
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Order Status</Label>
            <Select
              value={formState.orderStatus}
              onValueChange={(value) => onChange('orderStatus', value as OrderStatus)}
            >
              <SelectTrigger className="border-slate-300">
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
              <SelectTrigger className="border-slate-300">
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
            <Label className="text-xs font-semibold text-slate-600">User Type</Label>
            <Select
              value={formState.userType}
              onValueChange={(value) => onChange('userType', value as UserType)}
            >
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {userTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
              <SelectTrigger className="border-slate-300">
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
      </div>

      <div className="rounded-lg bg-white/60 p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
          Pricing & Discounts
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Discount Percentage</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              value={formState.discountAmount}
              onChange={(event) => onChange('discountAmount', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.discountAmount} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Discount Type</Label>
            <Select
              value={formState.discountType || ''}
              onValueChange={(value) => onChange('discountType', value)}
            >
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent>
                {discountTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Discount Code</Label>
            <Input
              placeholder="PROMO2024"
              value={formState.discountCode}
              onChange={(event) => onChange('discountCode', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.discountCode} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Shipping Amount</Label>
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

      <div className="rounded-lg bg-white/60 p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
          Customer Contact
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Phone</Label>
            <Input
              placeholder="+1 555 123 4567"
              value={formState.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.phone} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Email</Label>
            <Input
              type="email"
              placeholder="customer@email.com"
              value={formState.email}
              onChange={(event) => onChange('email', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.email} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/60 p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
          Additional Options
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Notification Type</Label>
            <Select
              value={formState.notificationType || ''}
              onValueChange={(value) => onChange('notificationType', value)}
            >
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Busy Voucher Id</Label>
            <Input
              placeholder="Voucher id"
              value={formState.busyVoucherId}
              onChange={(event) => onChange('busyVoucherId', event.target.value)}
              className="border-slate-300"
            />
            <FieldError message={errors.busyVoucherId} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-600">Order Note</Label>
            <Textarea
              placeholder="Internal note for this order..."
              value={formState.orderComment}
              onChange={(event) => onChange('orderComment', event.target.value)}
              className="min-h-[80px] resize-none border-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
