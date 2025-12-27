'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/core/api/generated/spring/schemas';

interface ProductBasicInfoSectionProps {
  form?: UseFormReturn<Record<string, unknown>>;
  isViewMode?: boolean;
  product?: ProductDTO | null;
}

export function ProductBasicInfoSection({
  form,
  isViewMode = false,
  product,
}: ProductBasicInfoSectionProps) {
  const errors = form?.formState?.errors;

  if (isViewMode) {
    if (!product) {
      return (
        <Card className="border shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Basic Information</h3>
                <p className="text-[10px] text-muted-foreground">Essential product details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-sm text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Basic Information</h3>
              <p className="text-[10px] text-muted-foreground">Essential product details</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Product Name */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Product Name
                <span className="ml-1 text-rose-600">*</span>
              </div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.name || 'Not specified'}
              </div>
            </div>

            {/* Barcode Text */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Barcode Text
                <span className="ml-1 text-rose-600">*</span>
              </div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.barcodeText || 'Not specified'}
              </div>
            </div>

            {/* Article Number */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Article Number</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">
                {product.articleNumber || 'Not specified'}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 md:col-span-3">
              <div className="text-xs font-semibold text-slate-600">Description</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border min-h-[60px]">
                {product.description || 'Not specified'}
              </div>
            </div>

            {/* Remark */}
            <div className="space-y-1 md:col-span-3">
              <div className="text-xs font-semibold text-slate-600">Remark</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border min-h-[60px]">
                {product.remark || 'Not specified'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Basic Information</h3>
            <p className="text-[10px] text-muted-foreground">Essential product details</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Product Name
                  <span className="ml-1 text-rose-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter product name"
                    className={cn(
                      'h-9',
                      errors.name && 'border-rose-500 focus-visible:ring-rose-500'
                    )}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      form.trigger('name');
                    }}
                  />
                </FormControl>
                {errors.name && (
                  <p className="text-xs text-rose-600">{String(errors.name.message)}</p>
                )}
              </FormItem>
            )}
          />

          {/* Barcode Text */}
          <FormField
            control={form.control}
            name="barcodeText"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Barcode Text
                  <span className="ml-1 text-rose-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., 0123456789"
                    className={cn(
                      'h-9',
                      errors.barcodeText && 'border-rose-500 focus-visible:ring-rose-500'
                    )}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      form.trigger('barcodeText');
                    }}
                  />
                </FormControl>
                {errors.barcodeText && (
                  <p className="text-xs text-rose-600">{String(errors.barcodeText.message)}</p>
                )}
              </FormItem>
            )}
          />

          {/* Article Number */}
          <FormField
            control={form.control}
            name="articleNumber"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Article Number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Optional SKU"
                    className="h-9"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      form.trigger('articleNumber');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status field intentionally hidden; defaults to ACTIVE on submission */}
        </div>

        {/* Description & Remark in 2 columns */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Describe the product..."
                    className="min-h-[60px] resize-none text-sm"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      form.trigger('description');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remark */}
          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Remark / Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Additional notes..."
                    className="min-h-[60px] resize-none text-sm"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      form.trigger('remark');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
