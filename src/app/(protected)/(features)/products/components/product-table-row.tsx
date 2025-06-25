"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import { RelationshipCell } from "./relationship-cell";
import type { ProductDTO } from "@/core/api/generated/spring/schemas/ProductDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface ProductTableRowProps {
  product: ProductDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (entityId: number, relationshipName: string, newValue: number | null) => Promise<void>;
  isUpdating?: boolean;
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
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: ProductTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => product.id && onSelect(product.id)}
        />
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell key={column.id} className="whitespace-nowrap px-3 py-2">
          {column.type === 'field' ? (
            // Render field column
            (() => {
              const field = product[column.accessor as keyof typeof product];
              
              if (column.id === 'name') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'code') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'description') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'category') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'basePrice') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'minPrice') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'maxPrice') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'remark') {
                
                return field?.toString() || "";
                
              }
              
              return field?.toString() || "";
            })()
          ) : (
            // Render relationship column
            (() => {
              
              return null;
            })()
          )}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="product:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => product.id && onDelete(product.id)}
              disabled={isDeleting || !product.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
