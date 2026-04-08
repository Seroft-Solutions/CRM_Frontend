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
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  useGetAllProducts,
  useGetProduct,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  getGetAllProductCatalogsQueryOptions,
  useGetAllProductCatalogs,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetAllProductVariantImagesByVariant } from '@/core/api/generated/spring/endpoints/product-variant-images/product-variant-images.gen';
import { Plus } from 'lucide-react';
import type { ProductCatalogDTO, ProductDTO } from '@/core/api/generated/spring/schemas';
import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';
import { FieldError } from './order-form-field-error';
import type { ItemErrors, OrderItemForm, WarehouseStockEntry } from './order-form-types';
import { getOrderItemBillingBreakdown } from './order-item-stock';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';

type ProductWithStock = ProductDTO & { stockQuantity?: number; salesStockQuantity?: number };
type ProductVariantWithWarehouseStocks = {
  id?: number;
  sku: string;
  price?: number;
  stockQuantity?: number;
  salesStockQuantity?: number;
  isPrimary?: boolean;
  variantStocks?: {
    id?: number;
    stockQuantity?: number;
    warehouse?: {
      id?: number;
      name?: string;
      code?: string;
    };
  }[];
};

function buildSearchableCommandValue(...parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) => {
      if (part === null || part === undefined) {
        return '';
      }

      return String(part).trim();
    })
    .filter(Boolean)
    .join(' ');
}

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

function ProductOptionRow({
  product,
  isSelected,
  stockQuantity,
}: {
  product: ProductDTO;
  isSelected: boolean;
  stockQuantity: number;
}) {
  const primaryVariantId =
    product.variants?.find((variant) => variant.isPrimary)?.id ?? product.variants?.[0]?.id;
  const { data: primaryVariantImages } = useGetAllProductVariantImagesByVariant(
    primaryVariantId ?? 0,
    {
      query: { enabled: !!primaryVariantId },
    }
  );
  const imageUrl = useMemo(
    () => resolveVariantImageUrl(primaryVariantImages),
    [primaryVariantImages]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <ProductImageThumbnail imageUrl={imageUrl} productName={product.name} size={28} />
        <div className="flex flex-1 flex-col">
          <span className="font-medium text-sm">{product.name}</span>
          <span className="text-xs text-muted-foreground">
            SKU: {product.articleNumber ?? product.articalNumber ?? 'N/A'} • Sales Stock:{' '}
            {stockQuantity} • Price: ₹
            {product.salePrice ?? product.discountedPrice ?? product.basePrice ?? 0}
          </span>
        </div>
      </div>
      <Check className={cn('ml-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
    </>
  );
}

function VariantOptionRow({
  variant,
  isSelected,
  warehousePreview,
}: {
  variant: ProductVariantWithWarehouseStocks;
  isSelected: boolean;
  warehousePreview: string;
}) {
  const { data: variantImages } = useGetAllProductVariantImagesByVariant(variant.id ?? 0, {
    query: { enabled: !!variant.id },
  });
  const imageUrl = useMemo(() => resolveVariantImageUrl(variantImages), [variantImages]);

  return (
    <>
      <div className="flex items-center gap-2">
        <ProductImageThumbnail imageUrl={imageUrl} productName={variant.sku} size={28} />
        <div className="flex flex-1 flex-col">
          <span className="font-medium text-sm">{variant.sku}</span>
          <span className="text-xs text-muted-foreground">
            Sales Stock: {variant.salesStockQuantity ?? variant.stockQuantity ?? 0} • ₹
            {variant.price ?? 0}
          </span>
          {warehousePreview ? (
            <span className="text-[11px] text-slate-500">Warehouses: {warehousePreview}</span>
          ) : null}
        </div>
      </div>
      <Check className={cn('ml-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
    </>
  );
}

function CatalogOptionRow({
  catalog,
  isSelected,
}: {
  catalog: ProductCatalogDTO;
  isSelected: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <ProductImageThumbnail
          imageUrl={resolveCatalogImageUrl(catalog.image)}
          productName={catalog.productCatalogName || 'Catalog'}
          size={28}
        />
        <div className="flex flex-1 flex-col">
          <span className="font-medium text-sm">{catalog.productCatalogName}</span>
          <span className="text-xs text-muted-foreground">
            Product: {catalog.product?.name ?? 'N/A'} • Items: {catalog.variants?.length ?? 0} • ₹
            {catalog.price ?? 0}
          </span>
        </div>
      </div>
      <Check className={cn('ml-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
    </>
  );
}

function SelectedOrderItemPreview({
  item,
  selectedCatalog,
  onOpenCatalogInNewTab,
  catalogDisplayLabel,
}: {
  item: OrderItemForm;
  selectedCatalog?: ProductCatalogDTO;
  onOpenCatalogInNewTab: (event: MouseEvent<HTMLButtonElement>, productCatalogId: number) => void;
  catalogDisplayLabel: string;
}) {
  const { data: productData } = useGetProduct(item.productId ?? 0, {
    query: {
      enabled: item.itemType === 'product' && !!item.productId && !item.variantId,
      staleTime: 5 * 60 * 1000,
    },
  });

  const previewVariantId =
    item.variantId ??
    productData?.variants?.find((variant) => variant.isPrimary)?.id ??
    productData?.variants?.[0]?.id;

  const { data: previewVariantImages } = useGetAllProductVariantImagesByVariant(
    previewVariantId ?? 0,
    {
      query: {
        enabled: !!previewVariantId,
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const imageUrl =
    item.itemType === 'catalog'
      ? resolveCatalogImageUrl(selectedCatalog?.image)
      : resolveVariantImageUrl(previewVariantImages);
  const productLabel =
    item.itemType === 'catalog'
      ? (selectedCatalog?.productCatalogName ?? item.productName ?? 'Catalog')
      : (item.productName ?? item.sku ?? 'Product');

  return (
    <div className="mt-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
      <ProductImageThumbnail
        imageUrl={imageUrl}
        productName={productLabel}
        size={48}
        className="shrink-0 rounded-md"
      />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.itemType === 'catalog' ? (
            <Badge className="bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-indigo-700">
              Catalog
            </Badge>
          ) : null}
          {item.productName &&
            (item.itemType === 'catalog' && item.productCatalogId ? (
              <button
                type="button"
                onClick={(event) => onOpenCatalogInNewTab(event, item.productCatalogId!)}
                className="truncate text-left text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
              >
                {catalogDisplayLabel}
              </button>
            ) : (
              <div className="truncate text-sm font-medium text-slate-900">{item.productName}</div>
            ))}
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
    value: string | number | WarehouseStockEntry[] | undefined
  ) => void;
  referrerForm?: string;
  referrerSessionId?: string;
  referrerField?: string;
  referrerCatalogField?: string;
};

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
    value: string | number | WarehouseStockEntry[] | undefined
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
  const variants = (variantsData || []) as ProductVariantWithWarehouseStocks[];

  const mapVariantWarehouseStocks = (
    variant?: ProductVariantWithWarehouseStocks
  ): WarehouseStockEntry[] => {
    if (!variant?.variantStocks?.length) {
      return [];
    }

    return variant.variantStocks
      .map((entry) => ({
        warehouseId: entry.warehouse?.id,
        warehouseName: entry.warehouse?.name,
        warehouseCode: entry.warehouse?.code,
        variantLabel: variant.sku,
        stockQuantity: Math.max(0, entry.stockQuantity ?? 0),
        salesStockQuantity: variant.salesStockQuantity ?? variant.stockQuantity ?? 0,
      }))
      .sort((a, b) => {
        const aName = (a.warehouseName || a.warehouseCode || '').toLowerCase();
        const bName = (b.warehouseName || b.warehouseCode || '').toLowerCase();

        return aName.localeCompare(bName);
      });
  };

  const getProductQuantity = (product: ProductDTO) => {
    const productWithStock = product as ProductWithStock;

    if (typeof productWithStock.salesStockQuantity === 'number') {
      return productWithStock.salesStockQuantity;
    }

    if (typeof productWithStock.stockQuantity === 'number') {
      return Math.max(0, productWithStock.stockQuantity);
    }

    if (!product.variants?.length) return 0;

    return product.variants.reduce(
      (total, variant) => total + (variant.salesStockQuantity ?? variant.stockQuantity ?? 0),
      0
    );
  };

  const getProductPrice = (product: ProductDTO) =>
    product.salePrice ?? product.discountedPrice ?? product.basePrice;

  const buildProductItem = (product: ProductDTO): OrderItemForm => {
    const price = getProductPrice(product);

    return {
      ...item,
      itemType: 'product',
      productCatalogId: undefined,
      productId: product.id,
      productName: product.name,
      sku: product.articleNumber ?? product.articalNumber,
      availableQuantity: getProductQuantity(product),
      warehouseStocks: undefined,
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
    variant: ProductVariantWithWarehouseStocks,
    baseItem: OrderItemForm
  ): OrderItemForm => ({
    ...baseItem,
    itemType: 'product',
    productCatalogId: undefined,
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    sku: variant.sku,
    availableQuantity: variant.salesStockQuantity ?? variant.stockQuantity ?? 0,
    warehouseStocks: mapVariantWarehouseStocks(variant),
    variantAttributes: `Variant: ${variant.sku}`,
    itemPrice:
      variant.price !== undefined && variant.price !== null
        ? String(variant.price)
        : getProductPrice(product) !== undefined && getProductPrice(product) !== null
          ? String(getProductPrice(product))
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
    onItemChange(index, 'availableQuantity', nextItem.availableQuantity);
    onItemChange(index, 'warehouseStocks', nextItem.warehouseStocks);
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
      .filter((variant): variant is ProductVariantWithWarehouseStocks => Boolean(variant));

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

  const effectiveQuantity = selectedVariant
    ? (selectedVariant.salesStockQuantity ?? selectedVariant.stockQuantity ?? 0)
    : selectedProduct
      ? getProductQuantity(selectedProduct)
      : undefined;
  const effectiveWarehouseStocks =
    selectedVariant && selectedVariant.variantStocks?.length
      ? mapVariantWarehouseStocks(selectedVariant)
      : undefined;

  useEffect(() => {
    if (item.itemType !== 'product') {
      if (item.availableQuantity !== undefined) {
        onItemChange(index, 'availableQuantity', undefined);
      }
      if (item.warehouseStocks !== undefined) {
        onItemChange(index, 'warehouseStocks', undefined);
      }

      return;
    }

    if (effectiveQuantity !== item.availableQuantity) {
      onItemChange(index, 'availableQuantity', effectiveQuantity);
    }
    const toComparableWarehouseStocks = (stocks?: WarehouseStockEntry[]) =>
      JSON.stringify(
        (stocks ?? []).map((entry) => ({
          warehouseId: entry.warehouseId ?? null,
          warehouseCode: entry.warehouseCode ?? '',
          warehouseName: entry.warehouseName ?? '',
          variantLabel: entry.variantLabel ?? '',
          stockQuantity: Math.max(0, entry.stockQuantity ?? 0),
          salesStockQuantity:
            typeof entry.salesStockQuantity === 'number' ? entry.salesStockQuantity : null,
        }))
      );

    const nextWarehouseStocks =
      effectiveWarehouseStocks && effectiveWarehouseStocks.length > 0
        ? effectiveWarehouseStocks
        : undefined;

    if (
      toComparableWarehouseStocks(item.warehouseStocks) !==
      toComparableWarehouseStocks(nextWarehouseStocks)
    ) {
      onItemChange(index, 'warehouseStocks', nextWarehouseStocks);
    }
  }, [
    effectiveQuantity,
    effectiveWarehouseStocks,
    index,
    item.availableQuantity,
    item.itemType,
    item.warehouseStocks,
    onItemChange,
  ]);

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
    <div className={cn('grid gap-3 grid-cols-1', showProductSelector && 'sm:grid-cols-2')}>
      {/* Product Combobox */}
      {showProductSelector && (
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
                        value={buildSearchableCommandValue(
                          product.name,
                          product.id,
                          product.barcodeText,
                          product.articleNumber,
                          product.articalNumber
                        )}
                        onSelect={() => handleProductSelect(product.id!)}
                      >
                        <ProductOptionRow
                          product={product}
                          stockQuantity={getProductQuantity(product)}
                          isSelected={item.productId === product.id}
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

      {/* Variant Combobox */}
      {item.productId && variants.length > 0 && (
        <div className="space-y-1.5">
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
                    {variants.map((variant) => {
                      const variantWarehouseStocks = mapVariantWarehouseStocks(variant);
                      const warehousePreview = variantWarehouseStocks
                        .map(
                          (entry) =>
                            entry.warehouseCode ||
                            entry.warehouseName ||
                            `W${entry.warehouseId ?? ''}`
                        )
                        .filter((entry) => entry)
                        .join(', ');

                      return (
                        <CommandItem
                          key={variant.id}
                          value={buildSearchableCommandValue(variant.sku, variant.id)}
                          onSelect={() => togglePendingVariant(variant.id!)}
                        >
                          <VariantOptionRow
                            variant={variant}
                            warehousePreview={warehousePreview}
                            isSelected={pendingVariantIds.includes(variant.id ?? -1)}
                          />
                        </CommandItem>
                      );
                    })}
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
    value: string | number | WarehouseStockEntry[] | undefined
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
    onItemChange(index, 'availableQuantity', undefined);
    onItemChange(index, 'warehouseStocks', undefined);
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
                    value={buildSearchableCommandValue(
                      catalog.productCatalogName,
                      catalog.id,
                      catalog.product?.name
                    )}
                    onSelect={() => handleCatalogSelect(catalog.id!)}
                  >
                    <CatalogOptionRow
                      catalog={catalog}
                      isSelected={item.productCatalogId === catalog.id}
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
    const breakdown = getOrderItemBillingBreakdown(item);
    const qty = breakdown.billableQuantity;
    const price = Number.parseFloat(item.itemPrice) || 0;
    const tax = Number.parseFloat(item.itemTaxAmount) || 0;

    return Math.max(qty * price + tax, 0);
  };

  const handleOpenCatalogInNewTab = (
    event: MouseEvent<HTMLButtonElement>,
    productCatalogId: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(`/product-catalogs/${productCatalogId}`, '_blank', 'noopener,noreferrer');
  };

  const getCatalogDisplayLabel = (item: OrderItemForm) => {
    if (item.itemType !== 'catalog') {
      return item.productName ?? '';
    }

    const selectedCatalog = catalogData.find((catalog) => catalog.id === item.productCatalogId);
    const catalogName = selectedCatalog?.productCatalogName ?? item.productName ?? '';
    const variantCount = selectedCatalog?.variants?.length;

    if (variantCount === undefined) {
      return catalogName;
    }

    return `${catalogName} / ${variantCount}`;
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
    const breakdown = getOrderItemBillingBreakdown(item);
    const availableQuantity = breakdown.availableQuantity ?? undefined;
    const quantityErrorMessage = itemErrors?.[index]?.quantity;
    const warehouseStocks = (item.warehouseStocks ?? []).map((entry) => ({
      ...entry,
      stockQuantity: Math.max(0, entry.stockQuantity ?? 0),
    }));
    const selectedCatalog =
      item.itemType === 'catalog'
        ? catalogData.find((catalog) => catalog.id === item.productCatalogId)
        : undefined;
    const showWarehouseStocks =
      item.itemType === 'product' && Boolean(item.variantId) && warehouseStocks.length > 0;
    const backOrderMessage =
      breakdown.backOrderQuantity > 0
        ? `${breakdown.backOrderQuantity} item${breakdown.backOrderQuantity === 1 ? '' : 's'} will be placed as Back Order and excluded from current billing.`
        : undefined;

    return (
      <div
        key={`desktop-entry-${index}`}
        className={cn(entryIndex > 0 && groupSize > 1 && 'border-t border-slate-200 pt-4')}
      >
        <div className="grid grid-cols-11 gap-3 items-start">
          <div className="col-span-5">
            {item.itemType === 'catalog' ? (
              <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
            ) : (
              <ProductVariantSelector
                item={item}
                index={index}
                onApplyVariantSelection={onApplyVariantSelection}
                onItemChange={onItemChange}
                showProductSelector={entryIndex === 0}
              />
            )}
            {(item.productName || item.sku) && (
              <SelectedOrderItemPreview
                item={item}
                selectedCatalog={selectedCatalog}
                onOpenCatalogInNewTab={handleOpenCatalogInNewTab}
                catalogDisplayLabel={getCatalogDisplayLabel(item)}
              />
            )}
          </div>

          <div className="col-span-2">
            <Label className="text-xs font-semibold text-slate-600 mb-1.5">Qty</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={item.quantity}
              onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
              className="h-8 max-w-[108px] border-slate-300 px-2 text-sm"
            />
            {availableQuantity !== undefined && (
              <p className="mt-1 text-[11px] text-slate-500">
                Available {breakdown.stockScopeLabel} sales stock: {availableQuantity}
              </p>
            )}
            {showWarehouseStocks && (
              <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                <p className="text-[11px] font-semibold text-slate-600">Warehouse sales stock</p>
                <div className="mt-0.5 space-y-0.5">
                  {warehouseStocks.map((entry, stockIndex) => (
                    <p
                      key={`${entry.warehouseId ?? entry.warehouseCode ?? stockIndex}`}
                      className="text-[11px] text-slate-600"
                    >
                      {entry.warehouseName ||
                        entry.warehouseCode ||
                        `Warehouse ${entry.warehouseId ?? stockIndex + 1}`}
                      {': '}Stock: {entry.salesStockQuantity ?? entry.stockQuantity}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {backOrderMessage && (
              <p className="mt-1 text-[11px] font-medium text-amber-700">{backOrderMessage}</p>
            )}
            <FieldError message={quantityErrorMessage} />
          </div>

          <div className="col-span-2">
            <Label className="text-xs font-semibold text-slate-600 mb-1.5">Price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={item.itemPrice}
              readOnly
              className="h-8 max-w-[118px] border-slate-300 bg-slate-100 px-2 text-sm text-slate-700"
            />
            <FieldError message={itemErrors?.[index]?.itemPrice} />
          </div>

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
    const breakdown = getOrderItemBillingBreakdown(item);
    const availableQuantity = breakdown.availableQuantity ?? undefined;
    const quantityErrorMessage = itemErrors?.[index]?.quantity;
    const warehouseStocks = (item.warehouseStocks ?? []).map((entry) => ({
      ...entry,
      stockQuantity: Math.max(0, entry.stockQuantity ?? 0),
    }));
    const selectedCatalog =
      item.itemType === 'catalog'
        ? catalogData.find((catalog) => catalog.id === item.productCatalogId)
        : undefined;
    const showWarehouseStocks =
      item.itemType === 'product' && Boolean(item.variantId) && warehouseStocks.length > 0;
    const backOrderMessage =
      breakdown.backOrderQuantity > 0
        ? `${breakdown.backOrderQuantity} item${breakdown.backOrderQuantity === 1 ? '' : 's'} will be placed as Back Order and excluded from current billing.`
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
            <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
          ) : (
            <ProductVariantSelector
              item={item}
              index={index}
              onApplyVariantSelection={onApplyVariantSelection}
              onItemChange={onItemChange}
              showProductSelector={entryIndex === 0}
            />
          )}
          {(item.productName || item.sku) && (
            <SelectedOrderItemPreview
              item={item}
              selectedCatalog={selectedCatalog}
              onOpenCatalogInNewTab={handleOpenCatalogInNewTab}
              catalogDisplayLabel={getCatalogDisplayLabel(item)}
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
              className="h-8 border-slate-300 px-2 text-sm"
            />
            {availableQuantity !== undefined && (
              <p className="text-[11px] text-slate-500">
                Available {breakdown.stockScopeLabel} sales stock: {availableQuantity}
              </p>
            )}
            {showWarehouseStocks && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                <p className="text-[11px] font-semibold text-slate-600">Warehouse sales stock</p>
                <div className="mt-0.5 space-y-0.5">
                  {warehouseStocks.map((entry, stockIndex) => (
                    <p
                      key={`${entry.warehouseId ?? entry.warehouseCode ?? stockIndex}`}
                      className="text-[11px] text-slate-600"
                    >
                      {entry.warehouseName ||
                        entry.warehouseCode ||
                        `Warehouse ${entry.warehouseId ?? stockIndex + 1}`}
                      {': '}
                      Stock: {entry.salesStockQuantity ?? entry.stockQuantity}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {backOrderMessage && (
              <p className="text-[11px] font-medium text-amber-700">{backOrderMessage}</p>
            )}
            <FieldError message={quantityErrorMessage} />
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
              className="h-8 border-slate-300 bg-slate-100 px-2 text-sm text-slate-700"
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
            <h3 className="text-lg font-bold text-slate-800">Shopping Cart</h3>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'No items added'
                : `${items.length} item${items.length !== 1 ? 's' : ''} in cart`}
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
          <p className="mb-2 text-base font-semibold text-slate-700">Your cart is empty</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Click "Add Item" above to start adding products to this order
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
