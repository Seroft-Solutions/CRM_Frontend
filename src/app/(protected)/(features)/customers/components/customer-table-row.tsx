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
  onRelationshipUpdate?: (entityId: number, relationshipName: string, newValue: number | null) => Promise<void>;
  isUpdating?: boolean;
}

export function CustomerTableRow({ 
  customer, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
}: CustomerTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => customer.id && onSelect(customer.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {customer.customerBusinessName}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {customer.email}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {customer.mobile}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {customer.whatsApp}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {customer.contactPerson}
        
      </TableCell>
      

      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={customer.id || 0}
          relationshipName="state"
          currentValue={customer.state}
          options={relationshipConfigs.find(config => config.name === "state")?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "state")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="states"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={customer.id || 0}
          relationshipName="district"
          currentValue={customer.district}
          options={relationshipConfigs.find(config => config.name === "district")?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "district")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="districts"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={customer.id || 0}
          relationshipName="city"
          currentValue={customer.city}
          options={relationshipConfigs.find(config => config.name === "city")?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "city")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="cities"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={customer.id || 0}
          relationshipName="area"
          currentValue={customer.area}
          options={relationshipConfigs.find(config => config.name === "area")?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "area")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="areas"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="customer:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/customers/${customer.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="customer:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="customer:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => customer.id && onDelete(customer.id)}
              disabled={isDeleting || !customer.id}
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
