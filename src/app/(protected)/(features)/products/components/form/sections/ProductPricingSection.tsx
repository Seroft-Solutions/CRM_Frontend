'use client';

import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';

interface ProductPricingSectionProps {
  form?: UseFormReturn<Record<string, any>>;
  isViewMode?: boolean;
  productId?: number;
}

export function ProductPricingSection({ form, isViewMode = false, productId }: ProductPricingSectionProps) {
  const errors = form?.formState?.errors;

  // Fetch product data for view mode
  const { data: product, isLoading } = useGetProduct(productId || 0, {
    query: { enabled: isViewMode && !!productId },
  });

  const basePrice = parseFloat(form?.watch?.('basePrice')) || 0;
  const discountedPrice = parseFloat(form?.watch?.('discountedPrice')) || 0;
  const salePrice = parseFloat(form?.watch?.('salePrice')) || 0;

  // Always calculate both validation types to ensure consistent hook calls
  const priceValidation = useMemo(() => {
    if (!discountedPrice && !salePrice) {
      return null;
    }

    if (salePrice && discountedPrice && salePrice <= discountedPrice) {
      return {
        type: 'error',
        message: 'Sale price must be greater than discounted price',
      };
    }

    if (salePrice && discountedPrice && salePrice > discountedPrice) {
      const discount = ((1 - discountedPrice / salePrice) * 100).toFixed(1);
      return {
        type: 'success',
        message: `Discount: ${discount}% off`,
      };
    }

    return null;
  }, [basePrice, discountedPrice, salePrice]);

  // Prepare view mode data (always calculated to ensure consistent hooks)
  const viewBasePrice = product?.basePrice || 0;
  const viewDiscountedPrice = product?.discountedPrice || 0;
  const viewSalePrice = product?.salePrice || 0;

  const viewPriceValidation = useMemo(() => {
    if (!viewDiscountedPrice && !viewSalePrice) {
      return null;
    }

    if (viewSalePrice && viewDiscountedPrice && viewSalePrice <= viewDiscountedPrice) {
      return {
        type: 'error',
        message: 'Sale price must be greater than discounted price',
      };
    }

    if (viewSalePrice && viewDiscountedPrice && viewSalePrice > viewDiscountedPrice) {
      const discount = ((1 - viewDiscountedPrice / viewSalePrice) * 100).toFixed(1);
      return {
        type: 'success',
        message: `Discount: ${discount}% off`,
      };
    }

    return null;
  }, [viewBasePrice, viewDiscountedPrice, viewSalePrice]);

  if (isViewMode) {
    if (isLoading) {
      return (
        <Card className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pricing</h3>
                <p className="text-[10px] text-muted-foreground">Product pricing information</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      );
    }

    if (!product) {
      return (
        <Card className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pricing</h3>
                <p className="text-[10px] text-muted-foreground">Product pricing information</p>
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
      <Card className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pricing</h3>
              <p className="text-[10px] text-muted-foreground">Product pricing information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {/* Base Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Base Price
              </div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                ${viewBasePrice || '0.00'}
              </div>
            </div>

            {/* Discounted Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Discounted Price
              </div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                ${viewDiscountedPrice || 'Not set'}
              </div>
            </div>

            {/* Sale Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Sale Price
              </div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                ${viewSalePrice || 'Not set'}
              </div>
            </div>
          </div>

          {/* Price Validation Message */}
          {viewPriceValidation && (
            <div className={cn(
              'flex items-center gap-2 text-xs px-3 py-2 rounded-md',
              viewPriceValidation.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            )}>
              {viewPriceValidation.type === 'error' ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span>{viewPriceValidation.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pricing</h3>
            <p className="text-[10px] text-muted-foreground">Set product prices</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Base Price */}
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Base Price
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ''}
                      placeholder="0.00"
                      className={cn(
                        'h-9 pl-8',
                        errors.basePrice && 'border-rose-500 focus-visible:ring-rose-500'
                      )}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.trigger('basePrice');
                      }}
                    />
                  </div>
                </FormControl>
                {errors.basePrice && (
                  <p className="text-xs text-rose-600">{String(errors.basePrice.message)}</p>
                )}
              </FormItem>
            )}
          />

          {/* Discounted Price */}
          <FormField
            control={form.control}
            name="discountedPrice"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Discounted Price
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ''}
                      placeholder="0.00"
                      className={cn(
                        'h-9 pl-8',
                        errors.discountedPrice && 'border-rose-500 focus-visible:ring-rose-500'
                      )}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.trigger('discountedPrice');
                        form.trigger('salePrice');
                      }}
                    />
                  </div>
                </FormControl>
                {errors.discountedPrice && (
                  <p className="text-xs text-rose-600">{String(errors.discountedPrice.message)}</p>
                )}
              </FormItem>
            )}
          />

          {/* Sale Price */}
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Sale Price
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ''}
                      placeholder="0.00"
                      className={cn(
                        'h-9 pl-8',
                        errors.salePrice && 'border-rose-500 focus-visible:ring-rose-500'
                      )}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.trigger('salePrice');
                        form.trigger('discountedPrice');
                      }}
                    />
                  </div>
                </FormControl>
                {errors.salePrice && (
                  <p className="text-xs text-rose-600">{String(errors.salePrice.message)}</p>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Price Validation Feedback */}
        {priceValidation && (
          <div
            className={cn(
              'rounded-md border p-2',
              priceValidation.type === 'error' &&
                'border-rose-200 bg-rose-50',
              priceValidation.type === 'success' &&
                'border-green-200 bg-green-50'
            )}
          >
            <div className="flex items-center gap-2">
              {priceValidation.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <p
                className={cn(
                  'text-xs font-medium',
                  priceValidation.type === 'error' && 'text-rose-700',
                  priceValidation.type === 'success' && 'text-green-700'
                )}
              >
                {priceValidation.message}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
