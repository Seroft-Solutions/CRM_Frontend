'use client';

import { Button } from '@/components/ui/button';
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
import type { DiscountType } from '../data/order-data';
import { FieldError } from './order-form-field-error';
import type { ItemErrors, OrderItemForm } from './order-form-types';

type OrderFormItemsProps = {
  items: OrderItemForm[];
  itemErrors?: ItemErrors[];
  discountTypeOptions: (DiscountType | 'Unknown')[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, key: keyof OrderItemForm, value: string) => void;
};

export function OrderFormItems({
  items,
  itemErrors,
  discountTypeOptions,
  onAddItem,
  onRemoveItem,
  onItemChange,
}: OrderFormItemsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Order Items</h3>
          <p className="text-sm text-muted-foreground">Add line items tied to this order.</p>
        </div>
        <Button type="button" variant="outline" onClick={onAddItem}>
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No items yet. Add at least one item to detail the order.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`item-${index}`} className="rounded-md border border-dashed border-border p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-700">Item #{index + 1}</div>
                <Button type="button" variant="ghost" onClick={() => onRemoveItem(index)}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label>Item Status</Label>
                  <Input
                    placeholder="Status code"
                    value={item.itemStatus}
                    onChange={(event) => onItemChange(index, 'itemStatus', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.itemStatus} />
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={item.quantity}
                    onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.quantity} />
                </div>
                <div className="space-y-1">
                  <Label>Item Price</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.itemPrice}
                    onChange={(event) => onItemChange(index, 'itemPrice', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.itemPrice} />
                </div>
                <div className="space-y-1">
                  <Label>Tax Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.itemTaxAmount}
                    onChange={(event) => onItemChange(index, 'itemTaxAmount', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.itemTaxAmount} />
                </div>
                <div className="space-y-1">
                  <Label>Discount Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.discountAmount}
                    onChange={(event) => onItemChange(index, 'discountAmount', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.discountAmount} />
                </div>
                <div className="space-y-1">
                  <Label>Discount Type</Label>
                  <Select
                    value={item.discountType || ''}
                    onValueChange={(value) => onItemChange(index, 'discountType', value)}
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
                <div className="space-y-1 md:col-span-2">
                  <Label>Discount Code</Label>
                  <Input
                    placeholder="PROMO2024"
                    value={item.discountCode}
                    onChange={(event) => onItemChange(index, 'discountCode', event.target.value)}
                  />
                  <FieldError message={itemErrors?.[index]?.discountCode} />
                </div>
                <div className="space-y-1 md:col-span-3 lg:col-span-4">
                  <Label>Item Comment</Label>
                  <Textarea
                    placeholder="Notes or variant info..."
                    value={item.itemComment}
                    onChange={(event) => onItemChange(index, 'itemComment', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
