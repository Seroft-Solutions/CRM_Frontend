'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { productToast, handleProductError } from './product-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { ProductDTO, ProductDTOStatus } from '@/core/api/generated/spring/schemas';
import { z } from 'zod';

// Create simplified form schema for product creation
const productCreationSchema = productFormSchemaBase.omit({
  status: true,
}).extend({
  categoryHierarchy: productFormSchemaBase.pick({
    category: true,
    subCategory: true,
  }).partial(),
});

type ProductCreationFormData = {
  name: string;
  code: string;
  description?: string;
  basePrice?: string;
  minPrice?: string;
  maxPrice?: string;
  remark?: string;
  categoryHierarchy?: {
    category?: number;
    subCategory?: number;
  };
};

interface ProductCreateSheetProps {
  onSuccess?: (product: ProductDTO) => void;
  trigger?: React.ReactNode;
}

export function ProductCreateSheet({ onSuccess, trigger }: ProductCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProductCreationFormData>({
    resolver: zodResolver(productCreationSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      basePrice: '',
      minPrice: '',
      maxPrice: '',
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
        // Invalidate queries to trigger table refetch
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

        // Show success toast
        productToast.created();
        
        // Close sheet and reset form
        setIsOpen(false);
        form.reset();
        
        // Call the success callback with the created product
        // This will trigger auto-selection in the parent field
        onSuccess?.(data);
      },
      onError: (error) => {
        handleProductError(error);
      },
    },
  });

  const onSubmit = (data: ProductCreationFormData) => {
    // Transform the data to match the exact API format (ProductDTO)
    const productData: Partial<ProductDTO> = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      basePrice: data.basePrice ? Number(data.basePrice) : undefined,
      minPrice: data.minPrice ? Number(data.minPrice) : undefined,
      maxPrice: data.maxPrice ? Number(data.maxPrice) : undefined,
      remark: data.remark || undefined,
      // Create proper nested objects for category entities as required by generated schema
      category: data.categoryHierarchy?.category ? { 
        id: data.categoryHierarchy.category,
        name: '', // Will be populated by backend
        code: '', // Will be populated by backend
        status: ProductDTOStatus.ACTIVE
      } : undefined,
      subCategory: data.categoryHierarchy?.subCategory ? { 
        id: data.categoryHierarchy.subCategory,
        name: '', // Will be populated by backend
        code: '', // Will be populated by backend
        status: ProductDTOStatus.ACTIVE,
        category: { id: data.categoryHierarchy.category } as any
      } : undefined,
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

  // Auto-generate product code from name
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name && !value.code) {
        // Generate code from name: remove spaces, special chars, convert to uppercase
        const generatedCode = value.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toUpperCase()
          .substring(0, 20);
        form.setValue('code', generatedCode);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Create New Product
          </SheetTitle>
          <SheetDescription>
            Add a new product to your catalog. Fill in the required information below.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form 
            id="product-creation-form"
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6 mt-6"
          >
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                <p className="text-xs text-gray-500 mt-1">Essential product details</p>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Product Name
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Product Code
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product code (auto-generated from name)"
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
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
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
            </div>

            {/* Pricing Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Pricing Information</h3>
                <p className="text-xs text-gray-500 mt-1">Product pricing details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Base Price</FormLabel>
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
                  name="minPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Min Price</FormLabel>
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
                  name="maxPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Max Price</FormLabel>
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
              </div>
            </div>

            {/* Category Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Category Classification</h3>
                <p className="text-xs text-gray-500 mt-1">Product category and subcategory</p>
              </div>

              <FormField
                control={form.control}
                name="categoryHierarchy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Category & Subcategory</FormLabel>
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
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Additional Information</h3>
                <p className="text-xs text-gray-500 mt-1">Optional product details</p>
              </div>

              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Remarks</FormLabel>
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

        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}