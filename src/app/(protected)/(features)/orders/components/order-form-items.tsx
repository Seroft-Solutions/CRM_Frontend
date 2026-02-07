import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useEffect, useState } from 'react';
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  getGetAllProductCatalogsQueryOptions,
  useGetAllProductCatalogs,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { Plus } from 'lucide-react';
import type { ProductCatalogDTO, ProductDTO, ProductVariantDTO } from '@/core/api/generated/spring/schemas';
import { FieldError } from './order-form-field-error';
import type { ItemErrors, OrderItemForm } from './order-form-types';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

type OrderFormItemsProps = {
  items: OrderItemForm[];
  itemErrors?: ItemErrors[];
  onAddItem: () => void;
  onAddCatalogItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, key: keyof OrderItemForm, value: string | number | undefined) => void;
  referrerForm?: string;
  referrerSessionId?: string;
  referrerField?: string;
  referrerCatalogField?: string;
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

  const getProductQuantity = (product: ProductDTO) => {
    if (!product.variants?.length) return 0;
    return product.variants.reduce(
      (total, variant) => total + (variant.stockQuantity ?? 0),
      0
    );
  };

  // Handle product selection
  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Set product info
    onItemChange(index, 'itemType', 'product');
    onItemChange(index, 'productCatalogId', undefined);
    onItemChange(index, 'productId', product.id);
    onItemChange(index, 'productName', product.name);
    onItemChange(index, 'sku', product.barcodeText);
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
    onItemChange(index, 'itemType', 'product');
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
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {/* Product Combobox */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600">Select Product</Label>
        <Popover open={productOpen} onOpenChange={setProductOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={productOpen}
              className="w-full justify-between border-slate-300 hover:border-blue-400 h-9"
            >
              {selectedProduct ? (
                <span className="truncate text-sm">{selectedProduct.name}</span>
              ) : (
                <span className="text-muted-foreground text-sm">Choose a product...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search products..." className="h-9" />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.barcodeText} ${product.articleNumber ?? ''} ${product.articalNumber ?? ''}`}
                      onSelect={() => handleProductSelect(product.id!)}
                    >
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          SKU: {product.articleNumber ?? product.articalNumber ?? 'N/A'} •
                          QTY: {getProductQuantity(product)} •
                          Price: ₹{product.salePrice ?? product.discountedPrice ?? product.basePrice ?? 0}
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
                className="w-full justify-between border-slate-300 hover:border-blue-400 h-9"
              >
                {selectedVariant ? (
                  <span className="truncate text-sm">{selectedVariant.sku}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Choose a variant...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-[400px] p-0" align="start">
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
                          <span className="font-medium text-sm">{variant.sku}</span>
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

function buildCatalogAttributes(catalog: ProductCatalogDTO) {
  const variantSkus = (catalog.variants ?? [])
    .map((variant) => variant.sku)
    .filter((sku): sku is string => Boolean(sku));

  if (variantSkus.length > 0) {
    return `Includes: ${variantSkus.join(', ')}`;
  }

  if (catalog.product?.name) {
    return `Product: ${catalog.product.name}`;
  }

  return undefined;
}

function ProductCatalogSelector({
  item,
  index,
  onItemChange,
}: {
  item: OrderItemForm;
  index: number;
  onItemChange: (index: number, key: keyof OrderItemForm, value: string | number | undefined) => void;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);

  const { data: catalogData } = useGetAllProductCatalogs({
    size: 1000,
  }, {
    query: {
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    },
  });

  const catalogs = catalogData || [];
  const selectedCatalog = catalogs.find((catalog) => catalog.id === item.productCatalogId);

  const handleCatalogSelect = (catalogId: number) => {
    const catalog = catalogs.find((entry) => entry.id === catalogId);
    if (!catalog) return;

    onItemChange(index, 'itemType', 'catalog');
    onItemChange(index, 'productCatalogId', catalog.id);
    onItemChange(index, 'productId', undefined);
    onItemChange(index, 'variantId', undefined);
    onItemChange(index, 'sku', undefined);
    onItemChange(index, 'productName', catalog.productCatalogName);
    onItemChange(index, 'variantAttributes', buildCatalogAttributes(catalog));

    if (catalog.price !== undefined && catalog.price !== null) {
      onItemChange(index, 'itemPrice', String(catalog.price));
    }

    setCatalogOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">Select Product Catalog</Label>
      <Popover open={catalogOpen} onOpenChange={setCatalogOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={catalogOpen}
            className="w-full justify-between border-slate-300 hover:border-blue-400 h-9"
          >
            {selectedCatalog ? (
              <span className="truncate text-sm">{selectedCatalog.productCatalogName}</span>
            ) : (
              <span className="text-muted-foreground text-sm">Choose a catalog...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-[420px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search catalogs..." className="h-9" />
            <CommandList>
              <CommandEmpty>No catalog found.</CommandEmpty>
              <CommandGroup>
                {catalogs.map((catalog) => (
                  <CommandItem
                    key={catalog.id}
                    value={`${catalog.productCatalogName} ${catalog.product?.name ?? ''}`}
                    onSelect={() => handleCatalogSelect(catalog.id!)}
                  >
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium text-sm">{catalog.productCatalogName}</span>
                      <span className="text-xs text-muted-foreground">
                        Product: {catalog.product?.name ?? 'N/A'} • Items:{' '}
                        {catalog.variants?.length ?? 0} • ₹{catalog.price ?? 0}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        item.productCatalogId === catalog.id ? 'opacity-100' : 'opacity-0'
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
  );
}

export function OrderFormItems({
  items,
  itemErrors,
  onAddItem,
  onAddCatalogItem,
  onRemoveItem,
  onItemChange,
  referrerForm,
  referrerSessionId,
  referrerField,
  referrerCatalogField,
}: OrderFormItemsProps) {
  const { navigateWithDraftCheck } = useCrossFormNavigation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const options = getGetAllProductCatalogsQueryOptions(
      { size: 1000 },
      { query: { staleTime: 5 * 60 * 1000 } }
    );

    queryClient.prefetchQuery(options);
  }, [queryClient]);

  const calculateItemTotal = (item: OrderItemForm) => {
    const qty = Number.parseInt(item.quantity, 10) || 0;
    const price = Number.parseFloat(item.itemPrice) || 0;
    const tax = Number.parseFloat(item.itemTaxAmount) || 0;
    return Math.max(qty * price + tax, 0);
  };

  const handleCreateProduct = () => {
    if (referrerForm && referrerSessionId && referrerField) {
      navigateWithDraftCheck({
        entityPath: '/products/new',
        referrerForm,
        referrerSessionId,
        referrerField,
        referrerUrl: window.location.href,
      });
    } else {
      window.location.href = '/products/new';
    }
  };

  const handleCreateCatalog = () => {
    if (referrerForm && referrerSessionId && referrerCatalogField) {
      navigateWithDraftCheck({
        entityPath: '/product-catalogs/new',
        referrerForm,
        referrerSessionId,
        referrerField: referrerCatalogField,
        referrerUrl: window.location.href,
      });
    } else {
      window.location.href = '/product-catalogs/new';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <svg className="h-5 w-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Shopping Cart</h3>
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? 'No items added' : `${items.length} item${items.length !== 1 ? 's' : ''} in cart`}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onAddItem}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-md"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-dashed border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
              onClick={handleCreateProduct}
            >
              <Plus className="h-4 w-4" />
              Create Product/Catalog
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onAddCatalogItem}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-md"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              Add Product Catalog
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
              onClick={handleCreateCatalog}
            >
              <Plus className="h-4 w-4" />
              Create Catalog
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
            <svg className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="mb-2 text-base font-semibold text-slate-700">Your cart is empty</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Click "Add Item" above to start adding products to this order
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* Cart Items */}
          <div className="divide-y divide-slate-200">
            {items.map((item, index) => {
              const itemTotal = calculateItemTotal(item);

              return (
                <div key={`item-${index}`} className="hover:bg-slate-50/50 transition-colors">
                  {/* Desktop View - Grid Layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-3 p-4 items-start">
                    {/* Number */}
                    <div className="col-span-1 flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                    </div>

                    {/* Product/Catalog Selector & Info */}
                    <div className="col-span-5">
                      {item.itemType === 'catalog' ? (
                        <ProductCatalogSelector
                          item={item}
                          index={index}
                          onItemChange={onItemChange}
                        />
                      ) : (
                        <ProductVariantSelector
                          item={item}
                          index={index}
                          onItemChange={onItemChange}
                        />
                      )}
                      {(item.productName || item.sku) && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            {item.itemType === 'catalog' ? (
                              <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                                Catalog
                              </Badge>
                            ) : null}
                            {item.productName && (
                              item.itemType === 'catalog' && item.productCatalogId ? (
                                <Link
                                  href={`/product-catalogs/${item.productCatalogId}`}
                                  target="_blank"
                                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                >
                                  {item.productName}
                                </Link>
                              ) : (
                                <div className="text-sm font-medium text-slate-900">{item.productName}</div>
                              )
                            )}
                          </div>
                          {item.sku && (
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                          )}
                          {item.variantAttributes && (
                            <Badge variant="secondary" className="text-xs">{item.variantAttributes}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600 mb-1.5">Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.quantity}
                        onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                        className="h-9 border-slate-300"
                      />
                      <FieldError message={itemErrors?.[index]?.quantity} />
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600 mb-1.5">Price</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.itemPrice}
                        readOnly
                        className="h-9 border-slate-300 bg-slate-100 text-slate-700"
                      />
                      <FieldError message={itemErrors?.[index]?.itemPrice} />
                    </div>

                    {/* Total & Actions */}
                    <div className="col-span-2 flex flex-col gap-2">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Total</div>
                        <div className="text-lg font-bold text-slate-900">₹{itemTotal.toFixed(2)}</div>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile/Tablet View - Stacked Layout */}
                  <div className="lg:hidden p-4 space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Item #{index + 1}</div>
                          {itemTotal > 0 && (
                            <div className="text-lg font-bold text-cyan-600">₹{itemTotal.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>

                    {/* Product/Catalog Selector */}
                    <div>
                      {item.itemType === 'catalog' ? (
                        <ProductCatalogSelector
                          item={item}
                          index={index}
                          onItemChange={onItemChange}
                        />
                      ) : (
                        <ProductVariantSelector
                          item={item}
                          index={index}
                          onItemChange={onItemChange}
                        />
                      )}
                      {(item.productName || item.sku) && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            {item.itemType === 'catalog' ? (
                              <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                                Catalog
                              </Badge>
                            ) : null}
                            {item.productName && (
                              item.itemType === 'catalog' && item.productCatalogId ? (
                                <Link
                                  href={`/product-catalogs/${item.productCatalogId}`}
                                  target="_blank"
                                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                >
                                  {item.productName}
                                </Link>
                              ) : (
                                <div className="text-sm font-medium text-slate-900">{item.productName}</div>
                              )
                            )}
                          </div>
                          {item.sku && (
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                          )}
                          {item.variantAttributes && (
                            <Badge variant="secondary" className="text-xs">{item.variantAttributes}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Price Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.quantity}
                          onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                          className="h-9 border-slate-300"
                        />
                        <FieldError message={itemErrors?.[index]?.quantity} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Price</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={item.itemPrice}
                          readOnly
                          className="h-9 border-slate-300 bg-slate-100 text-slate-700"
                        />
                        <FieldError message={itemErrors?.[index]?.itemPrice} />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
