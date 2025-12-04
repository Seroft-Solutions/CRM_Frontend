'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  UserType,
  orderStatusOptions,
  paymentStatusOptions,
  shippingMethods,
} from '../data/mock-orders';

type OrderFormState = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  userType: UserType;
  orderBaseAmount: string;
  discountAmount: string;
  shippingAmount: string;
  phone: string;
  email: string;
  shippingMethod: string;
  shippingId?: string;
  discountCode?: string;
  notificationType?: string;
  busyFlag: boolean;
  busyVoucherId?: string;
  orderComment?: string;
};

interface OrderFormProps {
  initialOrder?: OrderRecord;
  onSubmitSuccess?: () => void;
}

export function OrderForm({ initialOrder, onSubmitSuccess }: OrderFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const defaultState: OrderFormState = useMemo(
    () => ({
      orderStatus: initialOrder?.orderStatus || 'Pending',
      paymentStatus: initialOrder?.paymentStatus || 'Pending',
      userType: initialOrder?.userType || 'B2C',
      orderBaseAmount: initialOrder ? initialOrder.orderBaseAmount.toString() : '',
      discountAmount: initialOrder ? initialOrder.discountAmount.toString() : '',
      shippingAmount: initialOrder ? initialOrder.shippingAmount.toString() : '',
      phone: initialOrder?.phone || '',
      email: initialOrder?.email || '',
      shippingMethod: initialOrder?.shippingMethod || '',
      shippingId: initialOrder?.shippingId || '',
      discountCode: initialOrder?.discountCode || '',
      notificationType: initialOrder?.notificationType || '',
      busyFlag: Boolean(initialOrder?.busyFlag),
      busyVoucherId: initialOrder?.busyVoucherId || '',
      orderComment: '',
    }),
    [initialOrder]
  );

  const [formState, setFormState] = useState<OrderFormState>(defaultState);

  const handleChange = (key: keyof OrderFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formState,
      orderBaseAmount: parseFloat(formState.orderBaseAmount || '0'),
      discountAmount: parseFloat(formState.discountAmount || '0'),
      shippingAmount: parseFloat(formState.shippingAmount || '0'),
    };

    setTimeout(() => {
      setSubmitting(false);
      toast.success('Order draft saved', {
        description: 'Form uses mock data for now. Hook up backend actions when ready.',
      });
      onSubmitSuccess?.();
      // eslint-disable-next-line no-console
      console.log('Order payload', payload);
    }, 300);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formState.orderStatus}
            onValueChange={(value) => handleChange('orderStatus', value as OrderStatus)}
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

        <div className="space-y-2">
          <Label>Payment Status</Label>
          <Select
            value={formState.paymentStatus}
            onValueChange={(value) => handleChange('paymentStatus', value as PaymentStatus)}
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

        <div className="space-y-2">
          <Label>User Type</Label>
          <Select
            value={formState.userType}
            onValueChange={(value) => handleChange('userType', value as UserType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B2C">B2C</SelectItem>
              <SelectItem value="B2B">B2B</SelectItem>
              <SelectItem value="Guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Shipping Method</Label>
          <Select
            value={formState.shippingMethod}
            onValueChange={(value) => handleChange('shippingMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a method" />
            </SelectTrigger>
            <SelectContent>
              {shippingMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Base Amount</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formState.orderBaseAmount}
            onChange={(event) => handleChange('orderBaseAmount', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Discount Amount</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formState.discountAmount}
            onChange={(event) => handleChange('discountAmount', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Shipping Amount</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formState.shippingAmount}
            onChange={(event) => handleChange('shippingAmount', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            placeholder="+1 555 123 4567"
            value={formState.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="customer@email.com"
            value={formState.email}
            onChange={(event) => handleChange('email', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Shipping Id</Label>
          <Input
            placeholder="Tracking / shipment id"
            value={formState.shippingId}
            onChange={(event) => handleChange('shippingId', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Discount Code</Label>
          <Input
            placeholder="PROMO2024"
            value={formState.discountCode}
            onChange={(event) => handleChange('discountCode', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Notification Type</Label>
          <Input
            placeholder="Email / SMS / Push"
            value={formState.notificationType}
            onChange={(event) => handleChange('notificationType', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Busy Voucher Id</Label>
          <Input
            placeholder="Voucher id"
            value={formState.busyVoucherId}
            onChange={(event) => handleChange('busyVoucherId', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Order Note</Label>
          <Textarea
            placeholder="Internal note for this order..."
            value={formState.orderComment}
            onChange={(event) => handleChange('orderComment', event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="inline-flex items-center gap-2">
          <Checkbox
            id="busyFlag"
            checked={formState.busyFlag}
            onCheckedChange={(checked) => handleChange('busyFlag', Boolean(checked))}
          />
          <Label htmlFor="busyFlag">Busy / voucher applied</Label>
          {formState.discountCode ? (
            <Badge variant="secondary" className="bg-amber-50 text-amber-800">
              Discount {formState.discountCode}
            </Badge>
          ) : null}
          {formState.busyVoucherId ? (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
              Voucher {formState.busyVoucherId}
            </Badge>
          ) : null}
        </div>

        <Button type="submit" disabled={submitting} className="px-8">
          {submitting ? 'Saving...' : 'Save order'}
        </Button>
      </div>
    </form>
  );
}
