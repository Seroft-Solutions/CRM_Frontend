'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { RelationshipCell } from './relationship-cell';
import { ClickableId } from '@/components/clickable-id';
import type { ProductDTO } from '@/core/api/generated/spring/schemas/ProductDTO';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';
import { ProductDTOStatus } from '@/core/api/generated/spring/schemas/ProductDTOStatus';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
import {
  getGetAllProductVariantsQueryOptions,
  useGetAllProductVariants,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  getGetAllProductVariantImagesByVariantQueryOptions,
  useGetAllProductVariantImagesByVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-images/product-variant-images.gen';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { downloadProductSheetPdf } from './product-download-sheet';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSelectionDisplayValue(
  selection: NonNullable<ProductVariantDTO['selections']>[number]
): string {
  return selection.option?.label || selection.rawValue || selection.option?.code || '';
}

function getVariantDescription(variant: ProductVariantDTO): string {
  const selections = variant.selections ?? [];
  const summary = selections
    .map((selection) => {
      const attributeLabel = selection.attribute?.label || selection.attribute?.name;
      const optionLabel = getSelectionDisplayValue(selection);

      if (attributeLabel && optionLabel) {
        return `${attributeLabel}: ${optionLabel}`;
      }

      return optionLabel || attributeLabel || '';
    })
    .filter(Boolean)
    .join(' • ');

  if (summary) {
    return summary;
  }

  return `Status: ${transformEnumValue(variant.status || 'ACTIVE')}`;
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

interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: unknown }>;
  displayField: string;
  isEditable: boolean;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface ProductTableRowProps {
  product: ProductDTO;
  onArchive: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  isUpdatingStatus: boolean;
  statusOptions: StatusOption[];
  isSelected: boolean;
  onSelect: (id: number) => void;
  selectionEnabled?: boolean;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (
    entityId: number,
    relationshipName: string,
    newValue: number | null,
    isBulkOperation?: boolean
  ) => Promise<void>;
  updatingCells?: Set<string>;
  visibleColumns: Array<{
    id: string;
    label: string;
    accessor: string;
    type: 'field' | 'relationship';
    visible: boolean;
    sortable: boolean;
  }>;
}

export function ProductTableRow({
  product,
  onArchive,
  onStatusChange,
  isUpdatingStatus,
  statusOptions,
  isSelected,
  onSelect,
  selectionEnabled = true,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: ProductTableRowProps) {
  const queryClient = useQueryClient();
  const [isStockDetailsOpen, setIsStockDetailsOpen] = useState(false);
  const [isDownloadingSheet, setIsDownloadingSheet] = useState(false);
  const hasImageColumn = visibleColumns.some((column) => column.visible && column.id === 'image');
  const shouldFetchVariants =
    Boolean(product.id) && !product.variants?.length && (isStockDetailsOpen || hasImageColumn);
  const { data: fetchedVariants = [] } = useGetAllProductVariants(
    shouldFetchVariants
      ? {
          'productId.equals': product.id!,
          size: 200,
          sort: ['id,asc'],
        }
      : undefined,
    {
      query: { enabled: shouldFetchVariants },
    }
  );
  const variants = product.variants?.length ? product.variants : (fetchedVariants ?? []);
  const primaryVariantId = useMemo(
    () => variants.find((variant) => variant.isPrimary)?.id ?? variants[0]?.id,
    [variants]
  );
  const { data: primaryVariantImages } = useGetAllProductVariantImagesByVariant(
    primaryVariantId ?? 0,
    {
      query: { enabled: hasImageColumn && !!primaryVariantId },
    }
  );
  const productStockQuantity = (product as ProductDTO & { stockQuantity?: number }).stockQuantity;
  const resolvedStockQuantity = useMemo(() => {
    if (typeof productStockQuantity === 'number') {
      return productStockQuantity;
    }

    return variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0);
  }, [productStockQuantity, variants]);
  const productImageUrl = useMemo(() => {
    const sortedImages = [...(product.images ?? [])].sort(
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
  }, [product.images]);
  const primaryVariantImageUrl = useMemo(
    () => resolveVariantImageUrl(primaryVariantImages),
    [primaryVariantImages]
  );
  const displayImageUrl = primaryVariantImageUrl ?? productImageUrl;

  const currentStatus = product.status;
  const getStatusBadge = (status: string) => {
    const info = statusOptions.find(
      (opt) => opt.value === status || opt.value.toString() === status
    );

    if (!info) return <Badge variant="secondary">{transformEnumValue(status)}</Badge>;

    return (
      <Badge variant="secondary" className={`${info.color} border-0 text-xs font-medium`}>
        {transformEnumValue(status)}
      </Badge>
    );
  };

  const handleDownloadSheet = async () => {
    if (!product.id || isDownloadingSheet) {
      return;
    }

    setIsDownloadingSheet(true);

    try {
      const variantsForSheet =
        variants.length > 0
          ? variants
          : await queryClient.fetchQuery(
              getGetAllProductVariantsQueryOptions(
                {
                  'productId.equals': product.id,
                  size: 200,
                  sort: ['id,asc'],
                },
                {
                  query: {
                    staleTime: 60_000,
                  },
                }
              )
            );
      const primaryVariantIdForSheet =
        variantsForSheet.find((variant) => variant.isPrimary)?.id ?? variantsForSheet[0]?.id;
      const primaryVariantImagesForSheet =
        primaryVariantIdForSheet && primaryVariantId === primaryVariantIdForSheet
          ? primaryVariantImages
          : primaryVariantIdForSheet
            ? await queryClient.fetchQuery(
                getGetAllProductVariantImagesByVariantQueryOptions(primaryVariantIdForSheet, {
                  query: {
                    staleTime: 60_000,
                  },
                })
              )
            : [];

      await downloadProductSheetPdf(
        product,
        variantsForSheet ?? [],
        primaryVariantImagesForSheet ?? []
      );
    } catch (error) {
      console.error('Failed to download product sheet', error);
      toast.error('Unable to download product sheet. Please try again.');
    } finally {
      setIsDownloadingSheet(false);
    }
  };

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => product.id && onSelect(product.id)}
          disabled={!selectionEnabled}
        />
      </TableCell>
      {visibleColumns.map((column) => {
        const getColumnClassName = () => {
          if (column.id === 'image') {
            return 'px-2 sm:px-3 py-2 w-[140px]';
          }

          if (['description', 'remark'].includes(column.id)) {
            return 'px-2 sm:px-3 py-2 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis';
          }

          if (column.id === 'name') {
            return 'px-2 sm:px-3 py-2 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis';
          }

          if (['basePrice', 'discountedPrice', 'salePrice', 'stockQuantity'].includes(column.id)) {
            return 'px-2 sm:px-3 py-2 whitespace-nowrap text-right';
          }

          if (column.id === 'id') {
            return 'px-2 sm:px-3 py-2 w-[80px] whitespace-nowrap';
          }

          return 'px-2 sm:px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis';
        };

        return (
          <TableCell
            key={column.id}
            className={getColumnClassName()}
            title={
              column.type === 'field' && ['description', 'remark', 'name'].includes(column.id)
                ? String(product[column.accessor as keyof typeof product] || '')
                : undefined
            }
          >
            {column.type === 'field'
              ? (() => {
                  const field = product[column.accessor as keyof typeof product];

                  if (column.id === 'name') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'barcodeText') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'description') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'basePrice') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'discountedPrice') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'salePrice') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'stockQuantity') {
                    return (
                      <div className="flex items-center justify-end gap-1">
                        <span className="tabular-nums font-medium">{resolvedStockQuantity}</span>
                        {variants.length > 0 && (
                          <Popover open={isStockDetailsOpen} onOpenChange={setIsStockDetailsOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                aria-label="Show variant stock details"
                              >
                                {isStockDetailsOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[340px] p-0">
                              <div className="border-b px-3 py-2">
                                <p className="text-sm font-semibold">Stock Details</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.name || 'Product'} • Total {resolvedStockQuantity}
                                </p>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {variants.map((variant) => (
                                  <div
                                    key={variant.id ?? variant.sku}
                                    className="flex items-start justify-between gap-3 border-b px-3 py-2 last:border-b-0"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold">
                                        {variant.sku}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {getVariantDescription(variant)}
                                      </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-xs font-semibold tabular-nums">
                                        {variant.stockQuantity ?? 0}
                                      </p>
                                      {variant.isPrimary ? (
                                        <Badge
                                          variant="outline"
                                          className="mt-1 border-blue-200 bg-blue-50 text-[10px] text-blue-700"
                                        >
                                          Primary
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    );
                  }

                  if (column.id === 'remark') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'articleNumber') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'status') {
                    return getStatusBadge(field as string);
                  }

                  if (column.id === 'createdBy') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'createdDate') {
                    return field ? format(new Date(field as string), 'PPp') : '';
                  }

                  if (column.id === 'lastModifiedBy') {
                    return field?.toString() || '';
                  }

                  if (column.id === 'lastModifiedDate') {
                    return field ? format(new Date(field as string), 'PPp') : '';
                  }

                  if (column.id === 'id') {
                    return <ClickableId id={field as string | number} entityType="products" />;
                  }

                  if (column.id === 'image') {
                    return (
                      <ProductImageThumbnail
                        imageUrl={displayImageUrl}
                        productName={product.name || 'Product'}
                        size={32}
                      />
                    );
                  }

                  return field?.toString() || '';
                })()
              : (() => {
                  if (column.id === 'category') {
                    const cellKey = `${product.id}-category`;

                    return (
                      <RelationshipCell
                        entityId={product.id || 0}
                        relationshipName="category"
                        currentValue={product.category}
                        options={
                          relationshipConfigs.find((config) => config.name === 'category')
                            ?.options || []
                        }
                        displayField="name"
                        onUpdate={(entityId, relationshipName, newValue) =>
                          onRelationshipUpdate
                            ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                            : Promise.resolve()
                        }
                        isEditable={
                          relationshipConfigs.find((config) => config.name === 'category')
                            ?.isEditable || false
                        }
                        isLoading={updatingCells.has(cellKey)}
                        className="min-w-[150px]"
                        relatedEntityRoute="product-categories"
                        showNavigationIcon={true}
                      />
                    );
                  }

                  if (column.id === 'subCategory') {
                    const cellKey = `${product.id}-subCategory`;

                    return (
                      <RelationshipCell
                        entityId={product.id || 0}
                        relationshipName="subCategory"
                        currentValue={product.subCategory}
                        options={
                          relationshipConfigs.find((config) => config.name === 'subCategory')
                            ?.options || []
                        }
                        displayField="name"
                        onUpdate={(entityId, relationshipName, newValue) =>
                          onRelationshipUpdate
                            ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                            : Promise.resolve()
                        }
                        isEditable={
                          relationshipConfigs.find((config) => config.name === 'subCategory')
                            ?.isEditable || false
                        }
                        isLoading={updatingCells.has(cellKey)}
                        className="min-w-[150px]"
                        relatedEntityRoute="product-sub-categories"
                        showNavigationIcon={true}
                      />
                    );
                  }

                  return null;
                })()}
          </TableCell>
        );
      })}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="product:read">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={() => void handleDownloadSheet()}
              disabled={isDownloadingSheet}
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Download product sheet</span>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/products/${product.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="product:update">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  disabled={isUpdatingStatus}
                >
                  <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Status Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentStatus !== ProductDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => product.id && onStatusChange(product.id, 'ACTIVE')}
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() => product.id && onStatusChange(product.id, 'INACTIVE')}
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductDTOStatus.DRAFT && (
                  <DropdownMenuItem
                    onClick={() => product.id && onStatusChange(product.id, 'DRAFT')}
                    className="text-gray-700"
                  >
                    <div className="w-4 h-4 mr-2 border border-current rounded" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => product.id && onArchive(product.id)}
                      className="text-red-700"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
