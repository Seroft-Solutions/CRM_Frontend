'use client';

import Link from 'next/link';
import { AlertTriangle, Archive, Eye, MoreVertical, Pencil, RotateCcw } from 'lucide-react';
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
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { RelationshipCell } from './relationship-cell';
import { ClickableId } from '@/components/clickable-id';
import type { ProductDTO } from '@/core/api/generated/spring/schemas/ProductDTO';
import { ProductDTOStatus } from '@/core/api/generated/spring/schemas/ProductDTOStatus';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
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
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: ProductTableRowProps) {
  const currentStatus = product.status;
  const statusInfo = statusOptions.find(
    (opt) => opt.value === currentStatus || opt.value.toString() === currentStatus
  );

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
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox checked={isSelected} onCheckedChange={() => product.id && onSelect(product.id)} />
      </TableCell>
      {visibleColumns.map((column, index) => {
        const getColumnClassName = () => {
          if (column.id === 'image') {
            return 'px-2 sm:px-3 py-2 w-[60px]';
          }

          if (['description', 'remark'].includes(column.id)) {
            return 'px-2 sm:px-3 py-2 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis';
          }

          if (column.id === 'name') {
            return 'px-2 sm:px-3 py-2 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis';
          }

          if (['basePrice', 'discountedPrice', 'salePrice'].includes(column.id)) {
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

                  if (column.id === 'code') {
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
                    return (
                      <ClickableId
                        id={field as string | number}
                        entityType="products"
                      />
                    );
                  }

                  if (column.id === 'image') {
                    const images = (product as any).images as any[] | undefined;
                    const primaryImageUrl =
                      images?.find((img: any) => img.isPrimary === true)?.cdnUrl ||
                      images?.[0]?.cdnUrl ||
                      null;

                    return (
                      <ProductImageThumbnail
                        imageUrl={primaryImageUrl}
                        productName={product.name || 'Product'}
                        size={40}
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
