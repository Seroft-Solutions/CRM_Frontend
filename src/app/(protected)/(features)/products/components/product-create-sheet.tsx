'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Barcode, Loader2, Package, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IntelligentCategoryField } from './intelligent-category-field';
import { useCreateProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { productFormSchemaBase } from './form/product-form-schema';
import { handleProductError, productToast } from './product-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { ProductDTO } from '@/core/api/generated/spring/schemas';
import { ProductDTOStatus } from '@/core/api/generated/spring/schemas';
import { toast } from 'sonner';
import { generateProductBarcodeCode, openBarcodePrintDialog } from './barcode-utils';

const productCreationSchema = productFormSchemaBase
  .omit({
    status: true,
  })
  .extend({
    articalNumber: productFormSchemaBase.shape.articalNumber,
    categoryHierarchy: productFormSchemaBase
      .pick({
        category: true,
        subCategory: true,
      })
      .partial(),
  })
  .refine(
    (data) => {
      if (!data.discountedPrice || !data.salePrice) {
        return true;
      }

      const discountedPrice = Number(data.discountedPrice);
      const salePrice = Number(data.salePrice);

      return salePrice > discountedPrice;
    },
    {
      message: 'Sale price must be greater than discounted price',
      path: ['salePrice'],
    }
  );

type ProductCreationFormData = {
  name: string;
  code: string;
  articalNumber?: string;
  description?: string;
  basePrice?: string;
  discountedPrice?: string;
  salePrice?: string;
  remark?: string;
  categoryHierarchy?: {
    category?: number;
    subCategory?: number;
  };
};

interface ProductCreateSheetProps {
  onSuccess?: (product: ProductDTO) => void;
  trigger?: React.ReactNode;
  isBusinessPartner?: boolean;
}

export function ProductCreateSheet({
  onSuccess,
  trigger,
  isBusinessPartner = false,
}: ProductCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProductCreationFormData>({
    resolver: zodResolver(productCreationSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      basePrice: '',
      discountedPrice: '',
      salePrice: '',
      articalNumber: '',
      remark: '',
      categoryHierarchy: {
        category: undefined,
        subCategory: undefined,
      },
    },
  });

  const { mutate: createProduct, isPending } = useCreateProduct({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ['getAllProducts'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countProducts'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['searchProducts'],
          refetchType: 'active',
        });

        productToast.created();

        setIsOpen(false);
        form.reset();

        onSuccess?.(data);
      },
      onError: (error) => {
        handleProductError(error);
      },
    },
  });

  const onSubmit = (data: ProductCreationFormData) => {
    const productData: Partial<ProductDTO> = {
      name: data.name,
      code: data.code,
      articalNumber: data.articalNumber || undefined,
      description: data.description || undefined,
      basePrice: data.basePrice ? Number(data.basePrice) : undefined,
      discountedPrice: data.discountedPrice ? Number(data.discountedPrice) : undefined,
      salePrice: data.salePrice ? Number(data.salePrice) : undefined,
      remark: data.remark || undefined,

      category: data.categoryHierarchy?.category
        ? {
            id: data.categoryHierarchy.category,
            name: '',
            code: '',
            status: ProductDTOStatus.ACTIVE,
          }
        : undefined,
      subCategory: data.categoryHierarchy?.subCategory
        ? {
            id: data.categoryHierarchy.subCategory,
            name: '',
            code: '',
            status: ProductDTOStatus.ACTIVE,
            category: { id: data.categoryHierarchy.category } as any,
          }
        : undefined,
      status: ProductDTOStatus.ACTIVE,
    };

    createProduct({ data: productData });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const handleGenerateBarcode = () => {
    const generatedCode = generateProductBarcodeCode(form.getValues('name'));

    form.setValue('code', generatedCode, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });

    toast.success('Barcode generated', {
      description: `Product code set to ${generatedCode}`,
    });
  };

  const handlePrintBarcode = () => {
    const productCode = form.getValues('code');

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

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <InlinePermissionGuard requiredPermission="product:create">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create Product</span>
            </Button>
          </InlinePermissionGuard>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 bg-slate-50">
        <div
          className={`sticky top-0 z-10 text-white shadow-sm ${
            isBusinessPartner
              ? 'bg-bp-primary'
              : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700'
          }`}
        >
          <SheetHeader className="px-6 py-5 space-y-1">
            <SheetTitle
              className={`flex items-center gap-2 text-lg font-semibold leading-tight ${
                isBusinessPartner ? 'text-bp-foreground' : 'text-white'
              }`}
            >
              <Package className="h-5 w-5" />
              Create New Product
            </SheetTitle>
            <SheetDescription
              className={`text-sm ${
                isBusinessPartner ? 'text-bp-foreground' : 'text-blue-100'
              }`}
            >
              Capture catalog information and map the product to the correct category.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-5">
          <Form {...form}>
            <form
              id="product-creation-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Basic Information Section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">Basic Information</h3>
                  <p className="text-xs text-slate-500">
                    Define how the product should appear across the catalog.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Product Name
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);

                            const currentCode = form.getValues('code');
                            if (!currentCode && e.target.value) {
                              const generatedCode = e.target.value
                                .replace(/[^a-zA-Z0-9\s]/g, '')
                                .replace(/\s+/g, '-')
                                .toUpperCase()
                                .substring(0, 20);
                              form.setValue('code', generatedCode);
                            }
                          }}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Product Code
                          <span className="text-red-500 ml-1">*</span>
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
                          placeholder="Enter product code (also used as barcode)"
                          {...field}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="articalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Article Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter article number"
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing Information Section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">Pricing Information</h3>
                  <p className="text-xs text-slate-500">
                    Set indicative prices to guide sales and margin checks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Base Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            max="999999"
                            step="0.01"
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Discounted Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            max="999999"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);

                              const salePrice = form.getValues('salePrice');
                              if (salePrice) {
                                form.trigger('salePrice');
                              }
                            }}
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Sale Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            max="999999"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);

                              const discountedPrice = form.getValues('discountedPrice');
                              if (discountedPrice) {
                                form.trigger('salePrice');
                              }
                            }}
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Category Information Section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Category Classification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Associate the product with the correct category hierarchy.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="categoryHierarchy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Category & Subcategory
                      </FormLabel>
                      <FormControl>
                        <IntelligentCategoryField
                          value={field.value}
                          onChange={field.onChange}
                          onError={(error) => {
                            form.setError('categoryHierarchy', { message: error });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Information Section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">Additional Information</h3>
                  <p className="text-xs text-slate-500">
                    Add optional remarks that help teams position the product.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="remark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Remarks
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional remarks or notes"
                          className="min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t px-6 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-creation-form"
              disabled={isPending}
              className={`min-w-[160px] ${
                isBusinessPartner
                  ? 'bg-bp-primary hover:bg-bp-primary-hover text-bp-foreground'
                  : ''
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
