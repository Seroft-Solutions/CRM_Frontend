"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/core/auth";
import { RelationshipCell } from "@/app/(protected)/(features)/call-types/components/table/relationship-cell";
import type { CallTypeDTO } from "@/core/api/generated/spring/schemas/CallTypeDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface CallTypeTableRowProps {
  callType: CallTypeDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (entityId: number, relationshipName: string, newValue: number | null, isBulkOperation?: boolean) => Promise<void>;
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

export function CallTypeTableRow({ 
  callType, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: CallTypeTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => callType.id && onSelect(callType.id)}
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
          {column.type === 'field' ? (
            // Render field column
            (() => {
              const field = callType[column.accessor as keyof typeof callType];
              
              if (column.id === 'name') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'description') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'remark') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'createdBy') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'createdDate') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              if (column.id === 'lastModifiedBy') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'lastModifiedDate') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
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
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[100px] sm:w-[120px]">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="callType:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/call-types/${callType.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callType:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/call-types/${callType.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callType:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
              onClick={() => callType.id && onDelete(callType.id)}
              disabled={isDeleting || !callType.id}
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
