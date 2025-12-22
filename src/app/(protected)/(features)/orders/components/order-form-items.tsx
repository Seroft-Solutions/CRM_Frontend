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
    <div className="space-y-4 rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30 p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <svg className="h-5 w-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Order Items</h3>
            <p className="text-sm text-muted-foreground">
              Add products to this order {items.length > 0 && `(${items.length} item${items.length !== 1 ? 's' : ''})`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onAddItem}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-md"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
            <svg className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="mb-2 text-base font-semibold text-slate-700">No items added yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Click "Add Item" above to start adding products to this order
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const qty = Number.parseInt(item.quantity, 10) || 0;
            const price = Number.parseFloat(item.itemPrice) || 0;
            const tax = Number.parseFloat(item.itemTaxAmount) || 0;
            const discount = Number.parseFloat(item.discountAmount) || 0;
            const itemTotal = Math.max(qty * price + tax - discount, 0);

            return (
              <div
                key={`item-${index}`}
                className="group relative overflow-hidden rounded-xl border-2 border-slate-200 bg-white p-5 shadow-md transition-all hover:border-cyan-300 hover:shadow-lg"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 opacity-50" />

                <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-sm font-bold text-white shadow-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Item #{index + 1}</div>
                      {itemTotal > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Total: <span className="font-semibold text-slate-700">₹{itemTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </Button>
                </div>

                <div className="relative">
                  <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Quantity</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.quantity}
                        onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                        className="border-slate-300 focus:border-cyan-400"
                      />
                      <FieldError message={itemErrors?.[index]?.quantity} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Item Price</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.itemPrice}
                        onChange={(event) => onItemChange(index, 'itemPrice', event.target.value)}
                        className="border-slate-300 focus:border-cyan-400"
                      />
                      <FieldError message={itemErrors?.[index]?.itemPrice} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Tax Amount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.itemTaxAmount}
                        onChange={(event) => onItemChange(index, 'itemTaxAmount', event.target.value)}
                        className="border-slate-300 focus:border-cyan-400"
                      />
                      <FieldError message={itemErrors?.[index]?.itemTaxAmount} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Item Status</Label>
                      <Input
                        placeholder="Status code"
                        value={item.itemStatus}
                        onChange={(event) => onItemChange(index, 'itemStatus', event.target.value)}
                        className="border-slate-300 focus:border-cyan-400"
                      />
                      <FieldError message={itemErrors?.[index]?.itemStatus} />
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <Label className="text-xs font-bold uppercase tracking-wide text-slate-600">Discount Details</Label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Discount Amount</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={item.discountAmount}
                          onChange={(event) => onItemChange(index, 'discountAmount', event.target.value)}
                          className="border-slate-300 focus:border-cyan-400"
                        />
                        <FieldError message={itemErrors?.[index]?.discountAmount} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Discount Type</Label>
                        <Select
                          value={item.discountType || ''}
                          onValueChange={(value) => onItemChange(index, 'discountType', value)}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-cyan-400">
                            <SelectValue placeholder="Select type" />
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
                          value={item.discountCode}
                          onChange={(event) => onItemChange(index, 'discountCode', event.target.value)}
                          className="border-slate-300 focus:border-cyan-400"
                        />
                        <FieldError message={itemErrors?.[index]?.discountCode} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Item Notes</Label>
                    <Textarea
                      placeholder="Add notes, variant info, or special instructions..."
                      value={item.itemComment}
                      onChange={(event) => onItemChange(index, 'itemComment', event.target.value)}
                      className="min-h-[60px] resize-none border-slate-300 focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
