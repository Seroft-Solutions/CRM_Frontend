"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/core/auth";
import { RelationshipCell } from "./relationship-cell";
import type { CustomerDTO } from "@/core/api/generated/spring/schemas/CustomerDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface CustomerTableRowProps {
  customer: CustomerDTO;
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

export function CustomerTableRow({ 
  customer, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: CustomerTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => customer.id && onSelect(customer.id)}
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
              const field = customer[column.accessor as keyof typeof customer];
              
              if (column.id === 'customerBusinessName') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'email') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'mobile') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'whatsApp') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'contactPerson') {
                
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
              
              if (column.id === 'state') {
                const cellKey = `${customer.id}-state`;
                return (
                  <RelationshipCell
                    entityId={customer.id || 0}
                    relationshipName="state"
                    currentValue={customer.state}
                    options={relationshipConfigs.find(config => config.name === "state")?.options || []}
                    displayField="name"
                    onUpdate={(entityId, relationshipName, newValue) => 
                      onRelationshipUpdate ? onRelationshipUpdate(entityId, relationshipName, newValue, false) : Promise.resolve()
                    }
                    isEditable={relationshipConfigs.find(config => config.name === "state")?.isEditable || false}
                    isLoading={updatingCells.has(cellKey)}
                    className="min-w-[150px]"
                    relatedEntityRoute="states"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'district') {
                const cellKey = `${customer.id}-district`;
                return (
                  <RelationshipCell
                    entityId={customer.id || 0}
                    relationshipName="district"
                    currentValue={customer.district}
                    options={relationshipConfigs.find(config => config.name === "district")?.options || []}
                    displayField="name"
                    onUpdate={(entityId, relationshipName, newValue) => 
                      onRelationshipUpdate ? onRelationshipUpdate(entityId, relationshipName, newValue, false) : Promise.resolve()
                    }
                    isEditable={relationshipConfigs.find(config => config.name === "district")?.isEditable || false}
                    isLoading={updatingCells.has(cellKey)}
                    className="min-w-[150px]"
                    relatedEntityRoute="districts"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'city') {
                const cellKey = `${customer.id}-city`;
                return (
                  <RelationshipCell
                    entityId={customer.id || 0}
                    relationshipName="city"
                    currentValue={customer.city}
                    options={relationshipConfigs.find(config => config.name === "city")?.options || []}
                    displayField="name"
                    onUpdate={(entityId, relationshipName, newValue) => 
                      onRelationshipUpdate ? onRelationshipUpdate(entityId, relationshipName, newValue, false) : Promise.resolve()
                    }
                    isEditable={relationshipConfigs.find(config => config.name === "city")?.isEditable || false}
                    isLoading={updatingCells.has(cellKey)}
                    className="min-w-[150px]"
                    relatedEntityRoute="cities"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'area') {
                const cellKey = `${customer.id}-area`;
                return (
                  <RelationshipCell
                    entityId={customer.id || 0}
                    relationshipName="area"
                    currentValue={customer.area}
                    options={relationshipConfigs.find(config => config.name === "area")?.options || []}
                    displayField="name"
                    onUpdate={(entityId, relationshipName, newValue) => 
                      onRelationshipUpdate ? onRelationshipUpdate(entityId, relationshipName, newValue, false) : Promise.resolve()
                    }
                    isEditable={relationshipConfigs.find(config => config.name === "area")?.isEditable || false}
                    isLoading={updatingCells.has(cellKey)}
                    className="min-w-[150px]"
                    relatedEntityRoute="areas"
                    showNavigationIcon={true}
                  />
                );
              }
              
              return null;
            })()
          )}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[100px] sm:w-[120px]">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="customer:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/customers/${customer.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="customer:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="customer:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
              onClick={() => customer.id && onDelete(customer.id)}
              disabled={isDeleting || !customer.id}
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
