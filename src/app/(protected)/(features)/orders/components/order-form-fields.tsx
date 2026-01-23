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
import {
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
  notificationTypeOptions: (NotificationType | 'Unknown')[];
  onChange: (key: keyof OrderFormState, value: string | boolean) => void;
  onVerifyDiscount: () => void;
};

export function OrderFormFields({
  formState,
  errors,
  orderStatusOptions,
  paymentStatusOptions,
  userTypeOptions,
  shippingMethodOptions,
  notificationTypeOptions,
  onChange,
  onVerifyDiscount,
}: OrderFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-white/60 px-4 pb-4 pt-0.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Status & Type
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Order Status</Label>
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
            <Label className="text-xs font-semibold text-slate-600">User Type</Label>
            <Select
              value={formState.userType}
              onValueChange={(value) => onChange('userType', value as UserType)}
            >
              <SelectTrigger className="h-10 w-full border-slate-300">
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
            <Label className="text-xs font-semibold text-slate-600">Notification Type</Label>
            <Select
              value={formState.notificationType || ''}
              onValueChange={(value) => onChange('notificationType', value)}
            >
              <SelectTrigger className="h-10 w-full border-slate-300">
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
        </div>
      </div>

      <div className="rounded-lg bg-white/60 px-4 pb-4 pt-0.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Discount
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Discount Code</Label>
            <div className="flex gap-2">
              <Input
                placeholder="PROMO2024"
                value={formState.discountCode}
                onChange={(event) => onChange('discountCode', event.target.value)}
                className="border-slate-300"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 bg-slate-50 border-slate-300 hover:bg-slate-100"
                onClick={onVerifyDiscount}
              >
                Verify
              </Button>
            </div>
            <FieldError message={errors.discountCode} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/60 px-4 pb-4 pt-0.5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Shipping
        </div>
        <div className="grid gap-4 grid-cols-3">
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
          Customer
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Customer</Label>
            <EnhancedCustomerRelationshipField
              value={formState.customerId ? Number(formState.customerId) : undefined}
              onValueChange={(value) => onChange('customerId', value ? String(value) : '')}
              placeholder="Select customer"
              canCreate={true}
              createPermission="customer:create:inline"
            />
            <FieldError message={errors.customerId} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Order Note</Label>
            <Textarea
              placeholder="Internal note for this order..."
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
