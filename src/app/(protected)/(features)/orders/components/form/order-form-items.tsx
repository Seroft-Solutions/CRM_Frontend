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
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
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
  linkId?: string;
  price?: number;
  stockQuantity?: number;
  isPrimary?: boolean;
  variantStocks?: {
    id?: number;
    stockQuantity?: number;
    salesStockQuantity?: number;
    warehouse?: {
      id?: number;
      name?: string;
      code?: string;
    };
  }[];
};

function getVariantQuantity(variant?: ProductVariantWithWarehouseStocks) {
  if (!variant?.variantStocks?.length) {
    return Math.max(0, variant?.stockQuantity ?? 0);
  }

  return variant.variantStocks.reduce(
    (total, entry) => total + (entry.salesStockQuantity ?? entry.stockQuantity ?? 0),
    0
  );
}

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

function haveSameIds(left: number[], right: number[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
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
            SKU: {product.articleNumber ?? product.articalNumber ?? 'N/A'} • Stock: {stockQuantity}{' '}
            • Price: ₹{product.salePrice ?? product.discountedPrice ?? product.basePrice ?? 0}
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
          {variant.linkId ? (
            <span className="text-xs text-slate-500">Link ID: {variant.linkId}</span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            Stock: {getVariantQuantity(variant)} • ₹{variant.price ?? 0}
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

function SelectedVariantPreview({ variant }: { variant: ProductVariantWithWarehouseStocks }) {
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
        {variant.linkId ? (
          <div className="text-xs text-slate-500">Link ID: {variant.linkId}</div>
        ) : null}
      </div>
    </div>
  );
}

function SelectedVariantImagePreview({ variant }: { variant: ProductVariantWithWarehouseStocks }) {
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

function SelectedVariantNameCard({ name }: { name: string }) {
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <div className="text-sm font-medium text-slate-900">{name}</div>
    </div>
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
  return (
    <div className="mt-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
      <ProductImageThumbnail
        imageUrl={resolveCatalogImageUrl(selectedCatalog?.image)}
        productName={selectedCatalog?.productCatalogName ?? item.productName ?? 'Catalog'}
        size={48}
        className="shrink-0 rounded-md"
      />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-indigo-700">
            Catalog
          </Badge>
          {item.productName && item.productCatalogId ? (
            <button
              type="button"
              onClick={(event) => onOpenCatalogInNewTab(event, item.productCatalogId!)}
              className="truncate text-left text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
            >
              {catalogDisplayLabel}
            </button>
          ) : (
            <div className="truncate text-sm font-medium text-slate-900">{item.productName}</div>
          )}
        </div>
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
  onApplyVariantSelection: (
    index: number,
    nextItems: OrderItemForm[],
    replaceCount?: number
  ) => void;
  onItemChange: (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | WarehouseStockEntry[] | undefined
  ) => void;
  selectedItemIndex?: number | null;
  onSelectItem?: (index: number) => void;
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
  selectedVariantIdsOverride,
  existingVariantItems,
  replaceCount = 1,
  hideSelectedVariantPreview = false,
  hideSelectedProductPreview = false,
  tableRowMode = false,
}: {
  item: OrderItemForm;
  index: number;
  onApplyVariantSelection: (
    index: number,
    nextItems: OrderItemForm[],
    replaceCount?: number
  ) => void;
  onItemChange: (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | WarehouseStockEntry[] | undefined
  ) => void;
  showProductSelector?: boolean;
  selectedVariantIdsOverride?: number[];
  existingVariantItems?: OrderItemForm[];
  replaceCount?: number;
  hideSelectedVariantPreview?: boolean;
  hideSelectedProductPreview?: boolean;
  tableRowMode?: boolean;
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
        salesStockQuantity: entry.salesStockQuantity ?? entry.stockQuantity ?? 0,
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
      (total, variant) => total + getVariantQuantity(variant as ProductVariantWithWarehouseStocks),
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
    availableQuantity: getVariantQuantity(variant),
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
  const showSecondaryVariantPreview = !showProductSelector && Boolean(selectedVariant);
  const existingItemsByVariantId = useMemo(
    () =>
      new Map(
        (existingVariantItems ?? [])
          .filter((entry): entry is OrderItemForm & { variantId: number } =>
            Boolean(entry.variantId)
          )
          .map((entry) => [entry.variantId, entry])
      ),
    [existingVariantItems]
  );

  const applyVariantSelection = () => {
    if (!selectedProduct) {
      return;
    }

    if (pendingVariantIds.length === 0) {
      onApplyVariantSelection(index, [buildProductItem(selectedProduct)], replaceCount);
      setVariantOpen(false);

      return;
    }

    const selectedVariants = pendingVariantIds
      .map((variantId) => variants.find((variant) => variant.id === variantId))
      .filter((variant): variant is ProductVariantWithWarehouseStocks => Boolean(variant));

    if (selectedVariants.length === 0) {
      return;
    }

    const nextRows = selectedVariants.map((variant, variantIndex) =>
      buildVariantItem(
        selectedProduct,
        variant,
        existingItemsByVariantId.get(variant.id ?? -1) ??
          (variantIndex === 0
            ? item
            : {
                itemType: 'product',
                itemStatus: '',
                quantity: '',
                itemPrice: '',
                itemTaxAmount: '',
                itemComment: '',
              })
      )
    );

    onApplyVariantSelection(index, nextRows, replaceCount);
    setVariantOpen(false);
  };

  const effectiveQuantity = selectedVariant
    ? getVariantQuantity(selectedVariant)
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
    const nextPendingVariantIds =
      selectedVariantIdsOverride && selectedVariantIdsOverride.length > 0
        ? selectedVariantIdsOverride
        : item.variantId
          ? [item.variantId]
          : [];

    setPendingVariantIds((current) =>
      haveSameIds(current, nextPendingVariantIds) ? current : nextPendingVariantIds
    );
  }, [item.productId, item.variantId, selectedVariantIdsOverride]);

  const selectedVariantLabel =
    pendingVariantIds.length === 0
      ? null
      : pendingVariantIds.length === 1
        ? (variants.find((variant) => variant.id === pendingVariantIds[0])?.sku ?? null)
        : `${pendingVariantIds.length} variants selected`;
  const secondaryVariantName = selectedVariant?.sku ?? item.sku ?? item.productName ?? 'Variant';
  const selectorLayoutClass = showProductSelector
    ? tableRowMode || hideSelectedProductPreview
      ? 'grid-cols-1'
      : 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,1.1fr)]'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={cn('grid gap-3', tableRowMode && 'gap-1', selectorLayoutClass)}>
      {showProductSelector ? (
        <div className={cn('space-y-1.5', tableRowMode && 'space-y-0')}>
          <div className={cn('space-y-1.5', tableRowMode && 'space-y-0')}>
            {!tableRowMode ? (
              <Label className="text-xs font-semibold text-slate-600">Select Product</Label>
            ) : null}
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className={cn(
                    'w-full justify-between border-slate-300 hover:border-blue-400 h-9',
                    tableRowMode &&
                      'h-7 rounded-none border-0 bg-transparent px-1 text-left text-xs font-bold text-blue-900 shadow-none hover:bg-blue-50'
                  )}
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

      {item.productId && variants.length > 0 && !tableRowMode && (
        <div
          className={cn(
            'space-y-1.5',
            tableRowMode && 'space-y-0',
            showProductSelector && !tableRowMode
              ? 'lg:col-start-2 lg:row-start-1'
              : !showProductSelector
                ? 'sm:col-start-2'
                : ''
          )}
        >
          {showProductSelector ? (
            <>
              {!tableRowMode ? (
                <Label className="text-xs font-semibold text-slate-600">
                  Select Variant(s) (Optional)
                </Label>
              ) : null}
              <Popover open={variantOpen} onOpenChange={setVariantOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={variantOpen}
                    className={cn(
                      'w-full justify-between border-slate-300 hover:border-blue-400 h-9',
                      tableRowMode &&
                        'mt-1 h-7 rounded-none border-slate-300 bg-white px-1 text-left text-xs text-blue-900 shadow-none'
                    )}
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
                                entry.warehouseName ||
                                entry.warehouseCode ||
                                `W${entry.warehouseId ?? ''}`
                            )
                            .filter((entry) => entry)
                            .join(', ');

                          return (
                            <CommandItem
                              key={variant.id}
                              value={buildSearchableCommandValue(
                                variant.sku,
                                variant.linkId,
                                variant.id
                              )}
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
              {selectedVariant && !showSecondaryVariantPreview && !hideSelectedVariantPreview ? (
                <SelectedVariantPreview variant={selectedVariant} />
              ) : null}
            </>
          ) : (
            <>
              <Label className="text-xs font-semibold text-slate-600">Selected Variant</Label>
              <SelectedVariantNameCard name={secondaryVariantName} />
            </>
          )}
        </div>
      )}

      {showProductSelector ? (
        !hideSelectedProductPreview && !tableRowMode ? (
          <div
            className={cn(
              'space-y-1.5',
              item.productId && variants.length > 0
                ? 'lg:col-start-3 lg:row-start-1'
                : 'lg:col-start-2'
            )}
          >
            <Label className="text-xs font-semibold text-slate-600">Selected Product</Label>
            {selectedProduct ? (
              <SelectedProductPreview product={selectedProduct} fallbackSku={item.sku} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3 text-sm text-slate-500">
                No product selected
              </div>
            )}
          </div>
        ) : null
      ) : null}
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
  selectedItemIndex,
  onSelectItem,
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
    groupSize: number,
    options?: {
      forceHideProductSelector?: boolean;
      hasGroupHeader?: boolean;
    }
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
    const availableStockLabel =
      item.itemType === 'product' && Boolean(item.variantId)
        ? 'Available variant stock'
        : 'Available product stock';
    const backOrderMessage =
      breakdown.backOrderQuantity > 0
        ? `Warning: ${breakdown.backOrderQuantity} qty exceeds available stock and will save in backlog.`
        : undefined;
    const showProductSelector = !(options?.forceHideProductSelector ?? false) && entryIndex === 0;
    const hasGroupHeader = options?.hasGroupHeader ?? false;
    const showLineItemFields =
      item.itemType === 'catalog' || Boolean(item.variantId) || !showProductSelector;
    const productGridClass = showLineItemFields
      ? 'lg:grid-cols-[minmax(0,2.6fr)_minmax(120px,0.75fr)_minmax(120px,0.75fr)_auto]'
      : 'lg:grid-cols-[minmax(0,2.6fr)_auto]';

    return (
      <div
        key={`desktop-entry-${index}`}
        className={cn(
          ((entryIndex > 0 && groupSize > 1) || hasGroupHeader) && 'border-t border-slate-200 pt-4'
        )}
      >
        {item.itemType === 'catalog' ? (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2.6fr)_104px_minmax(110px,0.65fr)_minmax(120px,0.75fr)_auto] lg:gap-x-1 lg:gap-y-4">
            <div className="min-w-0">
              <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
              {(item.productName || item.sku) && (
                <SelectedOrderItemPreview
                  item={item}
                  selectedCatalog={selectedCatalog}
                  onOpenCatalogInNewTab={handleOpenCatalogInNewTab}
                  catalogDisplayLabel={getCatalogDisplayLabel(item)}
                />
              )}
            </div>

            <div className="lg:col-start-3">
              <Label className="text-xs font-semibold text-slate-600 mb-1.5">Qty</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={item.quantity}
                onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
                className="h-9 border-slate-300"
              />
              {availableQuantity !== undefined && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {availableStockLabel}: {availableQuantity}
                </p>
              )}
              {showWarehouseStocks && (
                <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                  <p className="text-[11px] font-semibold text-slate-600">Warehouse stock</p>
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

            <div className="lg:col-start-4">
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

            <div className="flex flex-col gap-2 lg:col-start-5 lg:min-w-[88px]">
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
        ) : (
          <div className={cn('grid items-start gap-4 lg:gap-x-3 lg:gap-y-4', productGridClass)}>
            <div className="min-w-0">
              <ProductVariantSelector
                item={item}
                index={index}
                onApplyVariantSelection={onApplyVariantSelection}
                onItemChange={onItemChange}
                showProductSelector={showProductSelector}
              />
            </div>

            {showLineItemFields ? (
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
                {availableQuantity !== undefined && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {availableStockLabel}: {availableQuantity}
                  </p>
                )}
                {showWarehouseStocks && (
                  <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                    <p className="text-[11px] font-semibold text-slate-600">Warehouse stock</p>
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
            ) : null}

            {showLineItemFields ? (
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
            ) : null}

            <div className={cn('flex flex-col gap-2', !showLineItemFields && 'lg:items-end')}>
              {showLineItemFields ? (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Total</div>
                  <div className="text-lg font-bold text-slate-900">₹{itemTotal.toFixed(2)}</div>
                </div>
              ) : null}
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
        )}
      </div>
    );
  };

  const renderMobileEntry = (
    item: OrderItemForm,
    index: number,
    entryIndex: number,
    groupSize: number,
    options?: {
      forceHideProductSelector?: boolean;
      hasGroupHeader?: boolean;
    }
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
    const availableStockLabel =
      item.itemType === 'product' && Boolean(item.variantId)
        ? 'Available variant stock'
        : 'Available product stock';
    const backOrderMessage =
      breakdown.backOrderQuantity > 0
        ? `Warning: ${breakdown.backOrderQuantity} qty exceeds available stock and will save in backlog.`
        : undefined;
    const showProductSelector = !(options?.forceHideProductSelector ?? false) && entryIndex === 0;
    const hasGroupHeader = options?.hasGroupHeader ?? false;
    const showLineItemFields =
      item.itemType === 'catalog' || Boolean(item.variantId) || !showProductSelector;

    return (
      <div
        key={`mobile-entry-${index}`}
        className={cn(
          ((entryIndex > 0 && groupSize > 1) || hasGroupHeader) && 'border-t border-slate-200 pt-4'
        )}
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
              {showLineItemFields && itemTotal > 0 && (
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
                <SelectedOrderItemPreview
                  item={item}
                  selectedCatalog={selectedCatalog}
                  onOpenCatalogInNewTab={handleOpenCatalogInNewTab}
                  catalogDisplayLabel={getCatalogDisplayLabel(item)}
                />
              )}
            </>
          ) : (
            <ProductVariantSelector
              item={item}
              index={index}
              onApplyVariantSelection={onApplyVariantSelection}
              onItemChange={onItemChange}
              showProductSelector={showProductSelector}
            />
          )}
        </div>

        {showLineItemFields ? (
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
              {availableQuantity !== undefined && (
                <p className="text-[11px] text-slate-500">
                  {availableStockLabel}: {availableQuantity}
                </p>
              )}
              {showWarehouseStocks && (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                  <p className="text-[11px] font-semibold text-slate-600">Warehouse stock</p>
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
                className="h-9 border-slate-300 bg-slate-100 text-slate-700"
              />
              <FieldError message={itemErrors?.[index]?.itemPrice} />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderProductGroupHeader = (entries: Array<{ item: OrderItemForm; index: number }>) => {
    const firstEntry = entries[0];

    if (!firstEntry) {
      return null;
    }

    const selectedVariantIds = entries
      .map(({ item }) => item.variantId)
      .filter((variantId): variantId is number => typeof variantId === 'number');

    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <ProductVariantSelector
          item={firstEntry.item}
          index={firstEntry.index}
          onApplyVariantSelection={onApplyVariantSelection}
          onItemChange={onItemChange}
          showProductSelector
          selectedVariantIdsOverride={selectedVariantIds}
          existingVariantItems={entries.map(({ item }) => item)}
          replaceCount={entries.length}
          hideSelectedVariantPreview
        />
      </div>
    );
  };

  void renderDesktopEntry;

  const legacyItemRows = itemGroups.flatMap((group) => group.entries);
  const blankLegacyRows = Array.from({ length: Math.max(15 - legacyItemRows.length, 0) });
  const legacyItemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const renderLegacyItemRow = (item: OrderItemForm, index: number, rowIndex: number) => {
    const itemTotal = calculateItemTotal(item);
    const selectedCatalog =
      item.itemType === 'catalog'
        ? catalogData.find((catalog) => catalog.id === item.productCatalogId)
        : undefined;
    const isSelected = selectedItemIndex === index;

    return (
      <tr
        key={`legacy-item-${index}`}
        onClick={() => onSelectItem?.(index)}
        className={cn(
          'h-[34px] cursor-pointer align-top text-blue-900',
          isSelected && 'outline outline-2 -outline-offset-2 outline-blue-700 bg-blue-50'
        )}
      >
        <td className="border border-slate-300 px-1 py-1 text-center font-semibold">
          {rowIndex + 1}
        </td>
        <td className="border border-slate-300 px-1 py-1 font-bold">
          {item.itemType === 'catalog' ? (
            <div className="space-y-1">
              <ProductCatalogSelector item={item} index={index} onItemChange={onItemChange} />
              {(item.productName || item.sku) && (
                <SelectedOrderItemPreview
                  item={item}
                  selectedCatalog={selectedCatalog}
                  onOpenCatalogInNewTab={handleOpenCatalogInNewTab}
                  catalogDisplayLabel={getCatalogDisplayLabel(item)}
                />
              )}
            </div>
          ) : (
            <ProductVariantSelector
              item={item}
              index={index}
              onApplyVariantSelection={onApplyVariantSelection}
              onItemChange={onItemChange}
              showProductSelector
              hideSelectedProductPreview
              hideSelectedVariantPreview
              tableRowMode
            />
          )}
        </td>
        <td className="border border-slate-300 px-1 py-1 text-center font-semibold">Pcs.</td>
        <td className="border border-slate-300 px-1 py-1">
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={item.quantity}
            onChange={(event) => onItemChange(index, 'quantity', event.target.value)}
            className="h-7 rounded-none border-0 bg-transparent px-1 text-right text-xs font-bold text-blue-900 shadow-none focus-visible:ring-1"
          />
          <FieldError message={itemErrors?.[index]?.quantity} />
        </td>
        <td className="border border-slate-300 px-1 py-1">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={item.itemPrice}
            readOnly
            className="h-7 rounded-none border-0 bg-transparent px-1 text-right text-xs font-bold text-blue-900 shadow-none"
          />
          <FieldError message={itemErrors?.[index]?.itemPrice} />
        </td>
        <td className="border border-slate-300 px-2 py-2 text-right font-bold">
          {itemTotal > 0 ? itemTotal.toFixed(2) : '0'}
        </td>
        <td className="border border-slate-300 px-1 py-1 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveItem(index);
            }}
            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
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
        </td>
      </tr>
    );
  };

  return (
    <div className="overflow-hidden border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-500 px-3 py-1 text-center text-xs font-bold text-white">
        Items Order Details
      </div>
      <div className="flex flex-col gap-2 bg-[#efefef] p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-cyan-100">
            <svg
              className="h-4 w-4 text-cyan-700"
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
            <h3 className="text-sm font-bold text-slate-800">Product Selection</h3>
            <p className="text-[11px] text-muted-foreground">
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
              className="h-8 w-full rounded-none bg-blue-700 px-3 text-xs text-white shadow-sm hover:bg-blue-800 sm:w-auto"
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
              className="h-8 gap-1.5 rounded-none border-dashed border-cyan-300 text-xs text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
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
              className="h-8 w-full rounded-none bg-blue-700 px-3 text-xs text-white shadow-sm hover:bg-blue-800 sm:w-auto"
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
              className="h-8 gap-1.5 rounded-none border-dashed border-indigo-300 text-xs text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
              onClick={handleCreateCatalog}
            >
              <Plus className="h-4 w-4" />
              Create Catalog
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="m-2 flex flex-col items-center justify-center border border-dashed border-cyan-300 bg-cyan-50/50 p-8 text-center">
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
        <div className="overflow-hidden border-t border-slate-300 bg-white">
          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse text-[11px] leading-tight">
              <colgroup>
                <col className="w-[34px]" />
                <col />
                <col className="w-[74px]" />
                <col className="w-[82px]" />
                <col className="w-[94px]" />
                <col className="w-[104px]" />
                <col className="w-[42px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-200 text-slate-900">
                  <th className="border border-slate-400 px-1 py-1"></th>
                  <th className="border border-slate-400 px-1 py-1 text-center font-bold">
                    Item Name
                  </th>
                  <th className="border border-slate-400 px-1 py-1 text-center font-bold">Unit</th>
                  <th className="border border-slate-400 px-1 py-1 text-center font-bold">Qty</th>
                  <th className="border border-slate-400 px-1 py-1 text-center font-bold">Rate</th>
                  <th className="border border-slate-400 px-1 py-1 text-center font-bold">
                    Amount
                  </th>
                  <th className="border border-slate-400 px-1 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {legacyItemRows.map(({ item, index }, rowIndex) =>
                  renderLegacyItemRow(item, index, rowIndex)
                )}
                {blankLegacyRows.map((_, rowIndex) => (
                  <tr key={`legacy-blank-${rowIndex}`} className="h-[28px]">
                    <td className="border border-slate-300 px-1 text-center text-slate-700">
                      {legacyItemRows.length + rowIndex + 1}
                    </td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300 text-right text-blue-900">0</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                  </tr>
                ))}
                <tr className="bg-white text-blue-900">
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-bold">
                    {items.reduce((sum, item) => sum + (Number.parseFloat(item.quantity) || 0), 0)}
                  </td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-bold">
                    {legacyItemsTotal.toFixed(2)}
                  </td>
                  <td className="border border-slate-300"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-200 lg:hidden">
            {itemGroups.map((group) => (
              <div key={group.key} className="hover:bg-slate-50/50 transition-colors">
                {(() => {
                  const isProductVariantGroup =
                    group.entries.every(
                      ({ item }) => item.itemType === 'product' && Boolean(item.productId)
                    ) && group.entries.some(({ item }) => Boolean(item.variantId));

                  return (
                    <>
                      <div className="lg:hidden p-4 space-y-4">
                        {isProductVariantGroup ? renderProductGroupHeader(group.entries) : null}
                        {group.entries.map(({ item, index }, entryIndex) =>
                          renderMobileEntry(item, index, entryIndex, group.entries.length, {
                            forceHideProductSelector: isProductVariantGroup,
                            hasGroupHeader: isProductVariantGroup,
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
