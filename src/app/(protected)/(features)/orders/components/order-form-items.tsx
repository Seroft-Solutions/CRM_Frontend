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
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import type { ProductDTO, ProductVariantDTO } from '@/core/api/generated/spring/schemas';
import type { DiscountType } from '../data/order-data';
import { FieldError } from './order-form-field-error';
import type { ItemErrors, OrderItemForm } from './order-form-types';

type OrderFormItemsProps = {
  items: OrderItemForm[];
  itemErrors?: ItemErrors[];
  discountTypeOptions: (DiscountType | 'Unknown')[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, key: keyof OrderItemForm, value: string | number | undefined) => void;
};

// Helper component for product/variant selection
function ProductVariantSelector({
  item,
  index,
  onItemChange,
}: {
  item: OrderItemForm;
  index: number;
  onItemChange: (index: number, key: keyof OrderItemForm, value: string | number | undefined) => void;
}) {
  const [productOpen, setProductOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);

  // Fetch active products
  const { data: productsData } = useGetAllProducts({
    'status.equals': 'ACTIVE',
    size: 1000,
  });

  // Fetch variants for selected product
  const { data: variantsData } = useGetAllProductVariants(
    {
      'productId.equals': item.productId,
      'status.equals': 'ACTIVE',
      size: 100,
    },
    {
      query: {
        enabled: !!item.productId,
      },
    }
  );

  const products = productsData || [];
  const variants = variantsData || [];

  // Handle product selection
  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Set product info
    onItemChange(index, 'productId', product.id);
    onItemChange(index, 'productName', product.name);
    onItemChange(index, 'sku', product.code);
    onItemChange(index, 'variantAttributes', undefined);
    onItemChange(index, 'variantId', undefined);

    // Auto-populate price from product
    const price = product.salePrice ?? product.discountedPrice ?? product.basePrice;
    if (price !== undefined && price !== null) {
      onItemChange(index, 'itemPrice', String(price));
    }

    setProductOpen(false);
  };

  // Handle variant selection
  const handleVariantSelect = (variantId: number) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    // Set variant info
    onItemChange(index, 'variantId', variant.id);
    onItemChange(index, 'sku', variant.sku);

    // Build variant attributes string
    // Note: We'd need to fetch variant selections to get full attribute details
    // For now, just use SKU as identifier
    onItemChange(index, 'variantAttributes', `Variant: ${variant.sku}`);

    // Auto-populate price from variant (variant price overrides product price)
    if (variant.price !== undefined && variant.price !== null) {
      onItemChange(index, 'itemPrice', String(variant.price));
    }

    setVariantOpen(false);
  };

  const selectedProduct = products.find((p) => p.id === item.productId);
  const selectedVariant = variants.find((v) => v.id === item.variantId);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Product Combobox */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600">Select Product</Label>
        <Popover open={productOpen} onOpenChange={setProductOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={productOpen}
              className="w-full justify-between border-slate-300 hover:border-blue-400"
            >
              {selectedProduct ? (
                <span className="truncate">{selectedProduct.name}</span>
              ) : (
                <span className="text-muted-foreground">Choose a product...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search products..." className="h-9" />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.code}`}
                      onSelect={() => handleProductSelect(product.id!)}
                    >
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.code} • ₹{product.salePrice ?? product.discountedPrice ?? product.basePrice ?? 0}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          'ml-2 h-4 w-4',
                          item.productId === product.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Variant Combobox */}
      {item.productId && variants.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600">Select Variant (Optional)</Label>
          <Popover open={variantOpen} onOpenChange={setVariantOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={variantOpen}
                className="w-full justify-between border-slate-300 hover:border-blue-400"
              >
                {selectedVariant ? (
                  <span className="truncate">{selectedVariant.sku}</span>
                ) : (
                  <span className="text-muted-foreground">Choose a variant...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search variants..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No variant found.</CommandEmpty>
                  <CommandGroup>
                    {variants.map((variant) => (
                      <CommandItem
                        key={variant.id}
                        value={variant.sku}
                        onSelect={() => handleVariantSelect(variant.id!)}
                      >
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium">{variant.sku}</span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {variant.stockQuantity ?? 0} • ₹{variant.price ?? 0}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            'ml-2 h-4 w-4',
                            item.variantId === variant.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

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
                  {/* Product/Variant Selection */}
                  <div className="mb-4 rounded-lg bg-blue-50/50 p-4 border border-blue-200">
                    <div className="mb-3 flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <Label className="text-xs font-bold uppercase tracking-wide text-blue-700">Product Selection</Label>
                    </div>
                    <ProductVariantSelector
                      item={item}
                      index={index}
                      onItemChange={onItemChange}
                    />

                    {/* Display selected product info */}
                    {(item.productName || item.sku || item.variantAttributes) && (
                      <div className="mt-3 space-y-2 border-t border-blue-200 pt-3">
                        {item.productName && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Product:</span>
                            <Badge variant="outline" className="bg-white">{item.productName}</Badge>
                          </div>
                        )}
                        {item.sku && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">SKU:</span>
                            <Badge variant="secondary">{item.sku}</Badge>
                          </div>
                        )}
                        {item.variantAttributes && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Variant:</span>
                            <span className="text-xs text-slate-700">{item.variantAttributes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
