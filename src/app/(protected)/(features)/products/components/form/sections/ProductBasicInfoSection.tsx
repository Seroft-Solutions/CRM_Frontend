'use client';

import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Barcode, CheckCircle2, Package, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/core/api/generated/spring/schemas';
import { generateProductBarcodeCode, openBarcodePrintDialog } from '../../barcode-utils';

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
  const saveAsCatalog = Boolean(form?.watch?.('saveAsCatalog'));
  const discountedPrice = parseFloat(form?.watch?.('discountedPrice')) || 0;
  const salePrice = parseFloat(form?.watch?.('salePrice')) || 0;

  const handleGenerateBarcode = () => {
    if (!form) {
      return;
    }

    const generatedCode = generateProductBarcodeCode(String(form.getValues('name') ?? ''));

    form.setValue('barcodeText', generatedCode, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });

    toast.success('Barcode generated', {
      description: `Product code set to ${generatedCode}`,
    });
  };

  const handlePrintBarcode = () => {
    if (!form) {
      return;
    }

    const productCode = String(form.getValues('barcodeText') ?? '').trim();

    if (!productCode) {
      toast.error('Product code required', {
        description: 'Generate or enter a product code before printing.',
      });

      return;
    }

    const didOpenPrintDialog = openBarcodePrintDialog(productCode);

    if (!didOpenPrintDialog) {
      toast.error('Unable to print barcode', {
        description: 'Please check the product code and allow pop-ups for this site.',
      });
    }
  };

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
  }, [discountedPrice, salePrice]);

  const viewBasePrice = product?.basePrice || 0;
  const viewDiscountedPrice = product?.discountedPrice || 0;
  const viewSalePrice = product?.salePrice || 0;
  const viewStockQuantity =
    (product as ProductDTO & { stockQuantity?: number })?.stockQuantity || 0;

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
  }, [viewDiscountedPrice, viewSalePrice]);

  if (isViewMode) {
    if (!product) {
      return (
        <Card className="border shadow-md">
          <CardHeader className="pb-0 pt-0 px-4">
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
          <CardContent className="px-4 pb-0">
            <div className="text-sm text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-0 pt-0 px-4">
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
        <CardContent className="space-y-3 px-4 pb-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

            {/* Product Code */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Product Code
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
            <div className="space-y-1 md:col-span-1">
              <div className="text-xs font-semibold text-slate-600">Description</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border h-9">
                {product.description || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Remark */}
            <div className="space-y-1 md:col-span-1">
              <div className="text-xs font-semibold text-slate-600">Remark / Notes</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-md border h-9">
                {product.remark || 'Not specified'}
              </div>
            </div>

            {/* Base Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Base Price</div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                ₹{viewBasePrice || '0.00'}
              </div>
            </div>

            {/* Discounted Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Discounted Price</div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                {viewDiscountedPrice ? `₹${viewDiscountedPrice}` : 'Not set'}
              </div>
            </div>

            {/* Sale Price */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Sale Price</div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                {viewSalePrice ? `₹${viewSalePrice}` : 'Not set'}
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Stock</div>
              <div className="text-sm font-medium text-slate-800 bg-white px-3 py-2 rounded-md border border-primary/20">
                {viewStockQuantity}
              </div>
            </div>
          </div>

          {viewPriceValidation && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs px-3 py-2 rounded-md',
                viewPriceValidation.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              )}
            >
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
    <Card className="border shadow-md">
      <CardHeader className="pb-0 pt-0 px-4">
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
      <CardContent className="space-y-3 px-4 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

          {/* Product Code */}
          <FormField
            control={form.control}
            name="barcodeText"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-xs font-semibold text-slate-600">
                    Product Code
                    <span className="ml-1 text-rose-600">*</span>
                  </FormLabel>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-500 hover:text-slate-900"
                      onClick={handleGenerateBarcode}
                      title="Generate barcode code"
                    >
                      <Barcode className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-500 hover:text-slate-900"
                      onClick={handlePrintBarcode}
                      title="Print barcode"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter product code"
                    className={cn(
                      'h-9 font-mono',
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1 md:col-span-1">
                <FormLabel className="text-xs font-semibold text-slate-600">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Describe the product..."
                    className="h-9 min-h-9 resize-none text-sm overflow-hidden"
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
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
          {/* Remark */}
          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem className="space-y-1 md:col-span-1">
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Remark / Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Additional notes..."
                    className="h-9 min-h-9 resize-none text-sm overflow-hidden"
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

          {/* Base Price */}
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">Base Price</FormLabel>
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
          {/* Sale Price */}
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">Sale Price</FormLabel>
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

          {/* Stock (Auto-calculated from variants) */}
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-600">Stock</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    value={field.value || '0'}
                    readOnly
                    disabled
                    placeholder="0"
                    className="h-9 bg-slate-50 text-slate-700"
                  />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">Auto-calculated from variants</p>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <FormField
            control={form.control}
            name="saveAsCatalog"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 md:col-span-4">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(value) => field.onChange(!!value)}
                  />
                </FormControl>
                <FormLabel className="text-xs font-semibold text-slate-600">
                  Save as Catalog
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {saveAsCatalog && (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            <FormField
              control={form.control}
              name="productCatalogName"
              render={({ field }) => (
                <FormItem className="space-y-1 md:col-span-2">
                  <FormLabel className="text-xs font-semibold text-slate-600">
                    Product Catalog Name
                    <span className="ml-1 text-rose-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Enter catalog name"
                      className={cn(
                        'h-9',
                        errors.productCatalogName && 'border-rose-500 focus-visible:ring-rose-500'
                      )}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.trigger('productCatalogName');
                      }}
                    />
                  </FormControl>
                  {errors.productCatalogName && (
                    <p className="text-xs text-rose-600">
                      {String(errors.productCatalogName.message)}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCatalogPrice"
              render={({ field }) => (
                <FormItem className="space-y-1 md:col-span-2">
                  <FormLabel className="text-xs font-semibold text-slate-600">
                    Catalog Price
                    <span className="ml-1 text-rose-600">*</span>
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
                          errors.productCatalogPrice &&
                            'border-rose-500 focus-visible:ring-rose-500'
                        )}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          form.trigger('productCatalogPrice');
                        }}
                      />
                    </div>
                  </FormControl>
                  {errors.productCatalogPrice && (
                    <p className="text-xs text-rose-600">
                      {String(errors.productCatalogPrice.message)}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>
        )}

        {priceValidation && (
          <div
            className={cn(
              'rounded-md border p-2',
              priceValidation.type === 'error' && 'border-rose-200 bg-rose-50',
              priceValidation.type === 'success' && 'border-green-200 bg-green-50'
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
