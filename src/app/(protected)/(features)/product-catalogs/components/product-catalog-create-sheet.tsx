'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, BookOpen, Plus, ListFilter } from 'lucide-react';
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
import { useCreateProductCatalog } from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { productCatalogFormSchema } from './form/product-catalog-form-schema';
import { handleProductCatalogError, productCatalogToast } from './product-catalog-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas';
import { PaginatedRelationshipCombobox } from './form/paginated-relationship-combobox';
import {
    useGetAllProducts,
    useGetProduct,
    useSearchProducts,
    useCountProducts
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { ProductVariantManagerWrapper } from '@/app/(protected)/(features)/products/components/variants/ProductVariantManagerWrapper';

interface ProductCatalogCreateSheetProps {
    onSuccess?: (catalog: ProductCatalogDTO) => void;
    trigger?: React.ReactNode;
}

export function ProductCatalogCreateSheet({
    onSuccess,
    trigger,
}: ProductCatalogCreateSheetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(productCatalogFormSchema),
        defaultValues: {
            productCatalogName: '',
            price: '',
            description: '',
            product: undefined as unknown as number,
            variants: [],
            image: '',
        },
    });

    const productId = useWatch({ control: form.control, name: 'product' });
    const selectedVariantIds = useWatch({ control: form.control, name: 'variants' }) || [];
    const previousProductId = useRef<number | undefined>();

    useEffect(() => {
        if (previousProductId.current !== undefined && previousProductId.current !== productId) {
            form.setValue('variants', []);
            form.setValue('image', '');
        }
        previousProductId.current = productId;
    }, [productId, form]);

    const { data: productData } = useGetProduct(productId ?? 0, {
        query: {
            enabled: !!productId,
        },
    });

    const { data: variantsData, isLoading: isLoadingVariants } = useGetAllProductVariants(
        productId
            ? {
                'productId.equals': productId,
                size: 1000,
                sort: ['sku,asc'],
            }
            : undefined,
        {
            query: {
                enabled: !!productId,
            },
        }
    );

    const variants = useMemo(() => {
        if (!variantsData) return [];
        return Array.isArray(variantsData)
            ? variantsData
            : (variantsData as any).content
                ? (variantsData as any).content
                : (variantsData as any).data
                    ? (variantsData as any).data
                    : [];
    }, [variantsData]);

    const allSelected = variants.length > 0 && selectedVariantIds.length === variants.length;

    const handleVariantToggle = (variantId: number, checked: boolean) => {
        const updated = checked
            ? [...selectedVariantIds, variantId]
            : selectedVariantIds.filter((id: number) => id !== variantId);
        form.setValue('variants', updated);
    };

    const handleSelectAll = (checked: boolean) => {
        if (!checked) {
            form.setValue('variants', []);
            return;
        }
        const variantIds = variants
            .map((variant: any) => variant.id)
            .filter((id: number | undefined) => typeof id === 'number');
        form.setValue('variants', variantIds);
    };

    // Auto-select all variants when a product is first picked
    useEffect(() => {
        if (productId && variants.length > 0 && selectedVariantIds.length === 0) {
            handleSelectAll(true);
        }
    }, [productId, variants.length]);

    const { mutate: createCatalog, isPending } = useCreateProductCatalog({
        mutation: {
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['getAllProductCatalogs'] });
                queryClient.invalidateQueries({ queryKey: ['countProductCatalogs'] });
                queryClient.invalidateQueries({ queryKey: ['searchProductCatalogs'] });

                productCatalogToast.created();
                setIsOpen(false);
                form.reset();
                onSuccess?.(data);
            },
            onError: (error) => {
                handleProductCatalogError(error);
            },
        },
    });

    const onSubmit = (data: any) => {
        const payload: ProductCatalogDTO = {
            productCatalogName: data.productCatalogName,
            price: Number(data.price),
            description: data.description,
            product: { id: data.product } as any,
            variants: (data.variants || []).map((vId: number) => ({ id: vId })),
            image: data.image,
        };

        createCatalog({ data: payload });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            form.reset();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                {trigger || (
                    <InlinePermissionGuard requiredPermission="productCatalog:create">
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-medium"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create Catalog</span>
                        </Button>
                    </InlinePermissionGuard>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 bg-slate-50">
                <div className="sticky top-0 z-10 text-white shadow-sm bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700">
                    <SheetHeader className="px-6 py-5 space-y-1">
                        <SheetTitle className="flex items-center gap-2 text-lg font-semibold leading-tight text-white">
                            <BookOpen className="h-5 w-5" />
                            Create New Product Catalog
                        </SheetTitle>
                        <SheetDescription className="text-sm text-indigo-100">
                            Create a new entry in your product catalog.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="px-6 py-5">
                    <Form {...form}>
                        <form
                            id="product-catalog-creation-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                                <FormField
                                    control={form.control}
                                    name="productCatalogName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-slate-700">
                                                Catalog Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter catalog name"
                                                    {...field}
                                                    maxLength={50}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-slate-700">
                                                Price <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let cleaned = val.replace(/[^0-9.]/g, '');
                                                        const parts = cleaned.split('.');
                                                        if (parts.length > 2) {
                                                            cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
                                                        }
                                                        field.onChange(cleaned);
                                                        form.trigger('price');
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-slate-700">
                                                Product <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <PaginatedRelationshipCombobox
                                                    value={field.value}
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                    }}
                                                    displayField="name"
                                                    getOptionLabel={(option) => {
                                                        const name = option?.name ?? '';
                                                        const barcode = option?.barcodeText ?? '';
                                                        return barcode ? `${name} (${barcode})` : name;
                                                    }}
                                                    placeholder="Select product"
                                                    useGetAllHook={useGetAllProducts}
                                                    useSearchHook={useSearchProducts}
                                                    useCountHook={useCountProducts}
                                                    entityName="Products"
                                                    searchField="name"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {productId && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 shadow-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                                    <ListFilter className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Selected Variants</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">Map variants to this catalog entry</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center h-8 min-w-[32px] px-2 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-sm">
                                                {selectedVariantIds.length}
                                            </div>
                                        </div>

                                        {isLoadingVariants ? (
                                            <div className="flex items-center justify-center py-8 text-slate-400">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                <span className="text-sm font-medium">Loading variants...</span>
                                            </div>
                                        ) : variants.length > 0 ? (
                                            <div className="border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/60">
                                                {productData?.variantConfig?.id ? (
                                                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                                        <ProductVariantManagerWrapper
                                                            productId={productId}
                                                            productName={productData?.name || 'Product'}
                                                            variantConfigId={productData?.variantConfig?.id}
                                                            isViewMode={true}
                                                            selection={{
                                                                isRowSelected: (item) => {
                                                                    if (item.kind !== 'existing') return false;
                                                                    return selectedVariantIds.includes(item.row.id);
                                                                },
                                                                onRowToggle: (item, checked) => {
                                                                    if (item.kind !== 'existing') return;
                                                                    handleVariantToggle(item.row.id, checked);
                                                                },
                                                                isAllSelected: allSelected,
                                                                onToggleAll: handleSelectAll,
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center bg-slate-50/50">
                                                        <p className="text-sm text-slate-500 italic">This product has no variant configuration.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl">
                                                <p className="text-sm text-slate-500 italic">No variants available for this product.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-slate-700">Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter description" className="min-h-[80px]" {...field} />
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
                            form="product-catalog-creation-form"
                            disabled={isPending}
                            className="min-w-[160px] bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Catalog...
                                </>
                            ) : (
                                'Create Catalog'
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
