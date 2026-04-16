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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  getGetAllProductCatalogsQueryOptions,
  useGetAllProductCatalogs,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetAllProductVariantImagesByVariant } from '@/core/api/generated/spring/endpoints/product-variant-images/product-variant-images.gen';
import { Plus } from 'lucide-react';
import type {
  ProductCatalogDTO,
  ProductDTO,
  ProductVariantDTO,
} from '@/core/api/generated/spring/schemas';
import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';
import { FieldError } from './order-form-field-error';
import type { ItemErrors, OrderItemForm } from './order-form-types';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';

type OrderFormItemsProps = {
  items: OrderItemForm[];
  itemErrors?: ItemErrors[];
  onAddItem: () => void;
  onAddCatalogItem: () => void;
  onRemoveItem: (index: number) => void;
  onApplyVariantSelection: (index: number, nextItems: OrderItemForm[]) => void;
  onItemChange: (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | undefined
  ) => void;
  referrerForm?: string;
  referrerSessionId?: string;
  referrerField?: string;
  referrerCatalogField?: string;
};

function resolveVariantImageUrl(images?: ProductVariantImageDTO[]) {
  if (!images?.length) {
    return null;
  }

  const sortedImages = [...images].sort(
    (left, right) =>
      (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.displayOrder ?? Number.MAX_SAFE_INTEGER)
  );

  return (
    sortedImages.find((image) => image.isPrimary)?.thumbnailUrl ||
    sortedImages.find((image) => image.isPrimary)?.cdnUrl ||
    sortedImages[0]?.thumbnailUrl ||
    sortedImages[0]?.cdnUrl ||
    null
  );
}

function SelectedProductPreview({
  product,
  fallbackSku,
}: {
  product: ProductDTO;
  fallbackSku?: string;
}) {
  const primaryVariantId =
    product.variants?.find((variant) => variant.isPrimary)?.id ?? product.variants?.[0]?.id;
  const { data: primaryVariantImages } = useGetAllProductVariantImagesByVariant(
    primaryVariantId ?? 0,
    {
      query: {
        enabled: !!primaryVariantId,
        staleTime: 5 * 60 * 1000,
      },
    }
  );
  const imageUrl = useMemo(
    () => resolveVariantImageUrl(primaryVariantImages),
    [primaryVariantImages]
  );
  const productSku = product.articleNumber ?? product.articalNumber ?? fallbackSku ?? 'N/A';

  return (
    <div className="mt-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
      <ProductImageThumbnail
        imageUrl={imageUrl}
        productName={product.name}
        size={48}
        className="shrink-0 rounded-md"
      />
      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium text-slate-900">{product.name}</div>
        <div className="text-xs text-muted-foreground">SKU: {productSku}</div>
      </div>
    </div>
  );
}

function SelectedVariantPreview({ variant }: { variant: ProductVariantDTO }) {
  const { data: variantImages } = useGetAllProductVariantImagesByVariant(variant.id ?? 0, {
    query: {
      enabled: !!variant.id,
      staleTime: 5 * 60 * 1000,
    },
  });
  const imageUrl = useMemo(() => resolveVariantImageUrl(variantImages), [variantImages]);

  return (
    <div className="mt-2 flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
      <ProductImageThumbnail
        imageUrl={imageUrl}
        productName={variant.sku}
        size={48}
        className="shrink-0 rounded-md"
      />
      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium text-slate-900">{variant.sku}</div>
      </div>
    </div>
  );
}

function SelectedVariantImagePreview({ variant }: { variant: ProductVariantDTO }) {
  const { data: variantImages } = useGetAllProductVariantImagesByVariant(variant.id ?? 0, {
    query: {
      enabled: !!variant.id,
      staleTime: 5 * 60 * 1000,
    },
  });
  const imageUrl = useMemo(() => resolveVariantImageUrl(variantImages), [variantImages]);

  return (
    <div className="mt-2 flex items-start">
      <ProductImageThumbnail
        imageUrl={imageUrl}
        productName={variant.sku}
        size={72}
        className="shrink-0 rounded-md"
      />
    </div>
  );
}

function SelectedOrderItemPreview({
  item,
  selectedCatalog,
}: {
  item: OrderItemForm;
  selectedCatalog?: ProductCatalogDTO;
}) {
  return (
    <div className="mt-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
      <ProductImageThumbnail
        imageUrl={resolveCatalogImageUrl(selectedCatalog?.image)}
        productName={item.productName || 'Catalog'}
        size={48}
        className="shrink-0 rounded-md"
      />
      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium text-slate-900">
          {item.productName || 'Catalog'}
        </div>
        {item.sku ? <div className="text-xs text-muted-foreground">SKU: {item.sku}</div> : null}
        {item.variantAttributes ? (
          <Badge variant="secondary" className="text-xs">
            {item.variantAttributes}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

// Helper component for product/variant selection
function ProductVariantSelector({
  item,
  index,
  onApplyVariantSelection,
  onItemChange,
  showProductSelector = true,
}: {
  item: OrderItemForm;
  index: number;
  onApplyVariantSelection: (index: number, nextItems: OrderItemForm[]) => void;
  onItemChange: (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | undefined
  ) => void;
  showProductSelector?: boolean;
}) {
  const [productOpen, setProductOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [pendingVariantIds, setPendingVariantIds] = useState<number[]>([]);

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

    return product.variants.reduce((total, variant) => total + (variant.stockQuantity ?? 0), 0);
  };

  const getProductBasePrice = (product: ProductDTO) =>
    product.basePrice ?? product.salePrice ?? product.discountedPrice;

  const buildProductItem = (product: ProductDTO): OrderItemForm => {
    const price = getProductBasePrice(product);

    return {
      ...item,
      itemType: 'product',
      productCatalogId: undefined,
      productId: product.id,
      productName: product.name,
      sku: product.articleNumber ?? product.articalNumber,
      variantAttributes: undefined,
      variantId: undefined,
      itemPrice:
        price !== undefined && price !== null
          ? String(price)
          : item.variantId
            ? ''
            : item.itemPrice,
    };
  };

  const buildVariantItem = (
    product: ProductDTO,
    variant: ProductVariantDTO,
    baseItem: OrderItemForm
  ): OrderItemForm => ({
    ...baseItem,
    itemType: 'product',
    productCatalogId: undefined,
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    sku: variant.sku,
    variantAttributes: `Variant: ${variant.sku}`,
    itemPrice:
      getProductBasePrice(product) !== undefined && getProductBasePrice(product) !== null
        ? String(getProductBasePrice(product))
        : variant.price !== undefined && variant.price !== null
          ? String(variant.price)
          : baseItem.itemPrice,
  });

  // Handle product selection
  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId);

    if (!product) return;

    const nextItem = buildProductItem(product);

    onItemChange(index, 'itemType', nextItem.itemType);
    onItemChange(index, 'productCatalogId', nextItem.productCatalogId);
    onItemChange(index, 'productId', nextItem.productId);
    onItemChange(index, 'productName', nextItem.productName);
    onItemChange(index, 'sku', nextItem.sku);
    onItemChange(index, 'variantAttributes', nextItem.variantAttributes);
    onItemChange(index, 'variantId', nextItem.variantId);
    onItemChange(index, 'itemPrice', nextItem.itemPrice);
    setPendingVariantIds([]);

    setProductOpen(false);
  };

  const togglePendingVariant = (variantId: number) => {
    setPendingVariantIds((current) =>
      current.includes(variantId)
        ? current.filter((currentId) => currentId !== variantId)
        : [...current, variantId]
    );
  };

  const selectedProduct = products.find((p) => p.id === item.productId);
  const selectedVariant = variants.find((v) => v.id === item.variantId);
  const showSecondaryVariantPreview = !showProductSelector && Boolean(selectedVariant);

  const applyVariantSelection = () => {
    if (!selectedProduct) {
      return;
    }

    if (pendingVariantIds.length === 0) {
      onApplyVariantSelection(index, [buildProductItem(selectedProduct)]);
      setVariantOpen(false);

      return;
    }

    const selectedVariants = pendingVariantIds
      .map((variantId) => variants.find((variant) => variant.id === variantId))
      .filter((variant): variant is ProductVariantDTO => Boolean(variant));

    if (selectedVariants.length === 0) {
      return;
    }

    const [firstVariant, ...remainingVariants] = selectedVariants;
    const currentRow = buildVariantItem(selectedProduct, firstVariant, item);
    const additionalRows = remainingVariants.map((variant) =>
      buildVariantItem(selectedProduct, variant, {
        itemType: 'product',
        itemStatus: '',
        quantity: '',
        itemPrice: '',
        itemTaxAmount: '',
        itemComment: '',
      })
    );

    onApplyVariantSelection(index, [currentRow, ...additionalRows]);
    setVariantOpen(false);
  };

  useEffect(() => {
    setPendingVariantIds(item.variantId ? [item.variantId] : []);
  }, [item.productId, item.variantId]);

  const selectedVariantLabel =
    pendingVariantIds.length === 0
      ? null
      : pendingVariantIds.length === 1
        ? (variants.find((variant) => variant.id === pendingVariantIds[0])?.sku ?? null)
        : `${pendingVariantIds.length} variants selected`;

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {/* Product Combobox */}
      {showProductSelector ? (
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
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] sm:w-[400px] p-0"
              align="start"
            >
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
                            SKU: {product.articleNumber ?? product.articalNumber ?? 'N/A'} • QTY:{' '}
                            {getProductQuantity(product)} • Base Price: ₹
                            {product.basePrice ??
                              product.salePrice ??
                              product.discountedPrice ??
                              0}
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
          {selectedProduct ? (
            <SelectedProductPreview product={selectedProduct} fallbackSku={item.sku} />
          ) : null}
        </div>
      ) : (
        <div className="space-y-1.5">
          {showSecondaryVariantPreview && selectedVariant ? (
            <SelectedVariantImagePreview variant={selectedVariant} />
          ) : (
            <div aria-hidden="true" className="hidden sm:block" />
          )}
        </div>
      )}

      {/* Variant Combobox */}
      {item.productId && variants.length > 0 && (
        <div className={cn('space-y-1.5', !showProductSelector && 'sm:col-start-2')}>
          <Label className="text-xs font-semibold text-slate-600">
            Select Variant(s) (Optional)
          </Label>
          <Popover open={variantOpen} onOpenChange={setVariantOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={variantOpen}
                className="w-full justify-between border-slate-300 hover:border-blue-400 h-9"
              >
                {selectedVariantLabel ? (
                  <span className="truncate text-sm">{selectedVariantLabel}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Choose variant(s)...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] sm:w-[400px] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search variants..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No variant found.</CommandEmpty>
                  <CommandGroup>
                    {variants.map((variant) => (
                      <CommandItem
                        key={variant.id}
                        value={variant.sku}
                        onSelect={() => togglePendingVariant(variant.id!)}
                      >
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium text-sm">{variant.sku}</span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {variant.stockQuantity ?? 0} • Base Price: ₹
                            {selectedProduct?.basePrice ?? variant.price ?? 0}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            'ml-2 h-4 w-4',
                            pendingVariantIds.includes(variant.id ?? -1)
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="flex items-center justify-between border-t border-slate-200 p-2">
                <span className="text-xs text-muted-foreground">
                  {pendingVariantIds.length === 0
                    ? 'No variants selected'
                    : `${pendingVariantIds.length} variant${pendingVariantIds.length === 1 ? '' : 's'} selected`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingVariantIds([])}
                  >
                    Clear
                  </Button>
                  <Button type="button" size="sm" onClick={applyVariantSelection}>
                    {pendingVariantIds.length > 1 ? 'Add Selected Variants' : 'Apply'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {selectedVariant && !showSecondaryVariantPreview ? (
            <SelectedVariantPreview variant={selectedVariant} />
          ) : null}
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
  onItemChange: (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | undefined
  ) => void;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);

  const { data: catalogData } = useGetAllProductCatalogs(
    {
      size: 1000,
    },
    {
      query: {
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
      },
    }
  );

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
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] sm:w-[420px] p-0"
          align="start"
        >
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
  onApplyVariantSelection,
  onItemChange,
  referrerForm,
  referrerSessionId,
  referrerField,
  referrerCatalogField,
}: OrderFormItemsProps) {
  const { navigateWithDraftCheck } = useCrossFormNavigation();
  const queryClient = useQueryClient();
  const { data: catalogData = [] } = useGetAllProductCatalogs(
    {
      size: 1000,
    },
    {
      query: {
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
      },
    }
  );

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

  const itemGroups = useMemo(() => {
    const groups: Array<{ key: string; entries: Array<{ item: OrderItemForm; index: number }> }> =
      [];

    items.forEach((item, index) => {
      const lastGroup = groups[groups.length - 1];
      const firstEntry = lastGroup?.entries[0]?.item;
      const shouldGroupWithPrevious =
        Boolean(lastGroup) &&
        item.itemType === 'product' &&
        firstEntry?.itemType === 'product' &&
        Boolean(item.productId) &&
        firstEntry.productId === item.productId;

      if (shouldGroupWithPrevious) {
        lastGroup.entries.push({ item, index });

        return;
      }

      groups.push({
        key: `${item.itemType}-${item.productId ?? item.productCatalogId ?? index}-${index}`,
        entries: [{ item, index }],
      });
    });

    return groups;
  }, [items]);

  const renderDesktopEntry = (
    item: OrderItemForm,
    index: number,
    entryIndex: number,
    groupSize: number
  ) => {
    const itemTotal = calculateItemTotal(item);
    const selectedCatalog =
      item.itemType === 'catalog'
        ? catalogData.find((catalog) => catalog.id === item.productCatalogId)
        : undefined;

    return (
      <div
        key={`desktop-entry-${index}`}
        className={cn(entryIndex > 0 && groupSize > 1 && 'border-t border-slate-200 pt-4')}
      >
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2.6fr)_minmax(120px,0.75fr)_minmax(120px,0.75fr)_auto] lg:gap-x-3 lg:gap-y-4">
          <div className="min-w-0">
            {item.itemType === 'catalog' ? (
              <>
                <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
                {(item.productName || item.sku) && (
                  <SelectedOrderItemPreview item={item} selectedCatalog={selectedCatalog} />
                )}
              </>
            ) : (
              <ProductVariantSelector
                item={item}
                index={index}
                onApplyVariantSelection={onApplyVariantSelection}
                onItemChange={onItemChange}
                showProductSelector={entryIndex === 0}
              />
            )}
          </div>

          <div>
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

          <div>
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

          <div className="flex flex-col gap-2">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileEntry = (
    item: OrderItemForm,
    index: number,
    entryIndex: number,
    groupSize: number
  ) => {
    const itemTotal = calculateItemTotal(item);
    const selectedCatalog =
      item.itemType === 'catalog'
        ? catalogData.find((catalog) => catalog.id === item.productCatalogId)
        : undefined;

    return (
      <div
        key={`mobile-entry-${index}`}
        className={cn(entryIndex > 0 && groupSize > 1 && 'border-t border-slate-200 pt-4')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-sm font-bold text-white">
              {index + 1}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {groupSize > 1 ? `Variant #${entryIndex + 1}` : `Item #${index + 1}`}
              </div>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>

        <div className="mt-4">
          {item.itemType === 'catalog' ? (
            <>
              <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
              {(item.productName || item.sku) && (
                <SelectedOrderItemPreview item={item} selectedCatalog={selectedCatalog} />
              )}
            </>
          ) : (
            <ProductVariantSelector
              item={item}
              index={index}
              onApplyVariantSelection={onApplyVariantSelection}
              onItemChange={onItemChange}
              showProductSelector={entryIndex === 0}
            />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
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
    );
  };

  return (
    <div className="space-y-4 rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <svg
              className="h-5 w-5 text-cyan-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Purchase Items</h3>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'No items added'
                : `${items.length} item${items.length !== 1 ? 's' : ''} in purchase list`}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7h16M4 12h16M4 17h16"
                />
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
            <svg
              className="h-8 w-8 text-cyan-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <p className="mb-2 text-base font-semibold text-slate-700">Your purchase list is empty</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Click "Add Item" above to start adding products to this purchase order
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* Cart Items */}
          <div className="divide-y divide-slate-200">
            {itemGroups.map((group, groupIndex) => (
              <div key={group.key} className="hover:bg-slate-50/50 transition-colors">
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 p-4 items-start">
                  <div className="col-span-1 flex items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-sm font-bold text-white">
                      {groupIndex + 1}
                    </div>
                  </div>
                  <div className="col-span-11 space-y-4">
                    {group.entries.map(({ item, index }, entryIndex) =>
                      renderDesktopEntry(item, index, entryIndex, group.entries.length)
                    )}
                  </div>
                </div>

                <div className="lg:hidden p-4 space-y-4">
                  {group.entries.map(({ item, index }, entryIndex) =>
                    renderMobileEntry(item, index, entryIndex, group.entries.length)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
