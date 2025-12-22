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
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          value={formState.orderStatus}
          onValueChange={(value) => onChange('orderStatus', value as OrderStatus)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>Payment Status</Label>
        <Select
          value={formState.paymentStatus}
          onValueChange={(value) => onChange('paymentStatus', value as PaymentStatus)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>User Type</Label>
        <Select
          value={formState.userType}
          onValueChange={(value) => onChange('userType', value as UserType)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>Shipping Method</Label>
        <Select
          value={formState.shippingMethod}
          onValueChange={(value) => onChange('shippingMethod', value)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>Base Amount</Label>
        <Input
          type="number"
          min={0}
          placeholder="0.00"
          value={formState.orderBaseAmount}
          onChange={(event) => onChange('orderBaseAmount', event.target.value)}
        />
        <FieldError message={errors.orderBaseAmount} />
      </div>

      <div className="space-y-1">
        <Label>Discount Amount</Label>
        <Input
          type="number"
          min={0}
          placeholder="0.00"
          value={formState.discountAmount}
          onChange={(event) => onChange('discountAmount', event.target.value)}
        />
        <FieldError message={errors.discountAmount} />
      </div>

      <div className="space-y-1">
        <Label>Discount Type</Label>
        <Select
          value={formState.discountType || ''}
          onValueChange={(value) => onChange('discountType', value)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>Shipping Amount</Label>
        <Input
          type="number"
          min={0}
          placeholder="0.00"
          value={formState.shippingAmount}
          onChange={(event) => onChange('shippingAmount', event.target.value)}
        />
        <FieldError message={errors.shippingAmount} />
      </div>

      <div className="space-y-1">
        <Label>Phone</Label>
        <Input
          placeholder="+1 555 123 4567"
          value={formState.phone}
          onChange={(event) => onChange('phone', event.target.value)}
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="customer@email.com"
          value={formState.email}
          onChange={(event) => onChange('email', event.target.value)}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="space-y-1">
        <Label>Shipping Id</Label>
        <Input
          placeholder="Tracking / shipment id"
          value={formState.shippingId}
          onChange={(event) => onChange('shippingId', event.target.value)}
        />
        <FieldError message={errors.shippingId} />
      </div>

      <div className="space-y-1">
        <Label>Discount Code</Label>
        <Input
          placeholder="PROMO2024"
          value={formState.discountCode}
          onChange={(event) => onChange('discountCode', event.target.value)}
        />
        <FieldError message={errors.discountCode} />
      </div>

      <div className="space-y-1">
        <Label>Notification Type</Label>
        <Select
          value={formState.notificationType || ''}
          onValueChange={(value) => onChange('notificationType', value)}
        >
          <SelectTrigger>
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

      <div className="space-y-1">
        <Label>Busy Voucher Id</Label>
        <Input
          placeholder="Voucher id"
          value={formState.busyVoucherId}
          onChange={(event) => onChange('busyVoucherId', event.target.value)}
        />
        <FieldError message={errors.busyVoucherId} />
      </div>

      <div className="space-y-1 md:col-span-2 lg:col-span-4">
        <Label>Order Note</Label>
        <Textarea
          placeholder="Internal note for this order..."
          value={formState.orderComment}
          onChange={(event) => onChange('orderComment', event.target.value)}
        />
      </div>
    </div>
  );
}
