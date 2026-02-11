'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { ClickableId } from '@/components/clickable-id';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';
import { ProductVariantManagerWrapper } from '@/app/(protected)/(features)/products/components/variants/ProductVariantManagerWrapper';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas/ProductCatalogDTO';

interface ProductCatalogTableRowProps {
  productCatalog: ProductCatalogDTO;
  isSelected: boolean;
  onSelect: (id: number) => void;
  visibleColumns: Array<{
    id: string;
    label: string;
    accessor: string;
    type: 'field' | 'relationship';
    visible: boolean;
    sortable: boolean;
  }>;
}

export function ProductCatalogTableRow({
  productCatalog,
  isSelected,
  onSelect,
  visibleColumns,
}: ProductCatalogTableRowProps) {
  const [isVariantsExpanded, setIsVariantsExpanded] = useState(false);

  const productId = productCatalog.product?.id;
  const productName =
    productCatalog.product?.name || productCatalog.productCatalogName || 'Product';
  const catalogVariantIds = useMemo(
    () =>
      (productCatalog.variants || [])
        .map((variant) => variant.id)
        .filter((id): id is number => typeof id === 'number'),
    [productCatalog.variants]
  );

  const { data: productDetails, isLoading: isLoadingProductDetails } = useGetProduct(
    productId || 0,
    {
      query: {
        enabled: isVariantsExpanded && typeof productId === 'number',
      },
    }
  );

  const variantConfigId =
    productCatalog.product?.variantConfig?.id ?? productDetails?.variantConfig?.id;
  const canShowVariants = typeof productId === 'number' && catalogVariantIds.length > 0;
  const canRenderVariantsTable = canShowVariants && typeof variantConfigId === 'number';
  const totalColumnCount = visibleColumns.length + 2;
  const variantsButtonLabel = `${isVariantsExpanded ? 'Hide Variants' : 'Show Variants'} (${catalogVariantIds.length})`;

  const formatPrice = (value?: number) => {
    if (value === null || value === undefined) return '';

    return Number(value).toFixed(2);
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors">
        <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => productCatalog.id && onSelect(productCatalog.id)}
          />
        </TableCell>
        {visibleColumns.map((column, index) => {
          const cellClassName =
            column.id === 'image'
              ? 'px-2 sm:px-3 py-2 w-[90px]'
              : `
            px-2 sm:px-3 py-2
            ${index === 0 ? 'min-w-[120px]' : 'min-w-[100px]'}
            whitespace-nowrap overflow-hidden text-ellipsis
          `;

          return (
            <TableCell key={column.id} className={cellClassName}>
              {column.type === 'field'
                ? (() => {
                    const field = productCatalog[column.accessor as keyof typeof productCatalog];

                    if (column.id === 'id') {
                      return (
                        <ClickableId id={field as string | number} entityType="product-catalogs" />
                      );
                    }

                    if (column.id === 'image') {
                      return (
                        <ProductImageThumbnail
                          imageUrl={resolveCatalogImageUrl(productCatalog.image)}
                          productName={productCatalog.productCatalogName || 'Catalog'}
                          size={32}
                        />
                      );
                    }

                    if (column.id === 'productCatalogName') {
                      return field?.toString() || '';
                    }

                    if (column.id === 'price') {
                      return formatPrice(field as number | undefined);
                    }

                    if (column.id === 'description') {
                      return field?.toString() || '';
                    }

                    if (column.id === 'createdBy') {
                      return field?.toString() || '';
                    }

                    if (column.id === 'createdDate') {
                      return field ? format(new Date(field as string), 'PPP') : '';
                    }

                    if (column.id === 'lastModifiedBy') {
                      return field?.toString() || '';
                    }

                    if (column.id === 'lastModifiedDate') {
                      return field ? format(new Date(field as string), 'PPP') : '';
                    }

                    return field?.toString() || '';
                  })()
                : (() => {
                    if (column.id === 'product') {
                      return productCatalog.product?.name || '';
                    }

                    if (column.id === 'variants') {
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={!canShowVariants}
                          onClick={() => setIsVariantsExpanded((prev) => !prev)}
                        >
                          {variantsButtonLabel}
                        </Button>
                      );
                    }

                    return '';
                  })()}
            </TableCell>
          );
        })}
        <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <InlinePermissionGuard requiredPermission="productCatalog:read">
              <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                <Link href={`/product-catalogs/${productCatalog.id}`}>
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">View</span>
                </Link>
              </Button>
            </InlinePermissionGuard>
            <InlinePermissionGuard requiredPermission="productCatalog:update">
              <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                <Link href={`/product-catalogs/${productCatalog.id}/edit`}>
                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Edit</span>
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>
        </TableCell>
      </TableRow>

      {isVariantsExpanded ? (
        <TableRow className="bg-slate-50/60">
          <TableCell colSpan={totalColumnCount} className="p-4">
            {!canShowVariants ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No variants are linked to this catalog.
              </div>
            ) : !canRenderVariantsTable ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {isLoadingProductDetails ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading variant configuration...</span>
                  </div>
                ) : (
                  'Variant configuration is unavailable for this product.'
                )}
              </div>
            ) : (
              <ProductVariantManagerWrapper
                productId={productId}
                productName={productName}
                variantConfigId={variantConfigId}
                variantIdsFilter={catalogVariantIds}
                isViewMode={true}
              />
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
