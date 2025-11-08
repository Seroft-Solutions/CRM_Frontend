'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2, Archive, MoreVertical, RotateCcw, AlertTriangle } from 'lucide-react';
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
import type { ProductSubCategoryDTO } from '@/core/api/generated/spring/schemas/ProductSubCategoryDTO';
import { ProductSubCategoryDTOStatus } from '@/core/api/generated/spring/schemas/ProductSubCategoryDTOStatus';

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

interface ProductSubCategoryTableRowProps {
  productSubCategory: ProductSubCategoryDTO;
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

export function ProductSubCategoryTableRow({
  productSubCategory,
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
}: ProductSubCategoryTableRowProps) {
  const currentStatus = productSubCategory.status;
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
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => productSubCategory.id && onSelect(productSubCategory.id)}
        />
      </TableCell>
      {visibleColumns.map((column, index) => (
        <TableCell
          key={column.id}
          className={`
            px-2 sm:px-3 py-2 
            ${index === 0 ? 'min-w-[120px]' : 'min-w-[100px]'} 
            whitespace-nowrap overflow-hidden text-ellipsis
          `}
        >
          {column.type === 'field'
            ? (() => {
                const field =
                  productSubCategory[column.accessor as keyof typeof productSubCategory];

                if (column.id === 'name') {
                  return field?.toString() || '';
                }

                if (column.id === 'code') {
                  return field?.toString() || '';
                }

                if (column.id === 'description') {
                  return field?.toString() || '';
                }

                if (column.id === 'remark') {
                  return field?.toString() || '';
                }

                if (column.id === 'status') {
                  return getStatusBadge(field as string);
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
                if (column.id === 'category') {
                  const cellKey = `${productSubCategory.id}-category`;
                  return (
                    <RelationshipCell
                      entityId={productSubCategory.id || 0}
                      relationshipName="category"
                      currentValue={productSubCategory.category}
                      options={
                        relationshipConfigs.find((config) => config.name === 'category')?.options ||
                        []
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

                return null;
              })()}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="productSubCategory:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/product-sub-categories/${productSubCategory.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="productSubCategory:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/product-sub-categories/${productSubCategory.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="productSubCategory:update">
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
                {currentStatus !== ProductSubCategoryDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() =>
                      productSubCategory.id && onStatusChange(productSubCategory.id, 'ACTIVE')
                    }
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductSubCategoryDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() =>
                      productSubCategory.id && onStatusChange(productSubCategory.id, 'INACTIVE')
                    }
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductSubCategoryDTOStatus.DRAFT && (
                  <DropdownMenuItem
                    onClick={() =>
                      productSubCategory.id && onStatusChange(productSubCategory.id, 'DRAFT')
                    }
                    className="text-gray-700"
                  >
                    <div className="w-4 h-4 mr-2 border border-current rounded" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                {currentStatus !== ProductSubCategoryDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => productSubCategory.id && onArchive(productSubCategory.id)}
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
