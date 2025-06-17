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
import type { UserAvailabilityDTO } from "@/core/api/generated/spring/schemas/UserAvailabilityDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface UserAvailabilityTableRowProps {
  userAvailability: UserAvailabilityDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (entityId: number, relationshipName: string, newValue: number | null) => Promise<void>;
  isUpdating?: boolean;
}

export function UserAvailabilityTableRow({ 
  userAvailability, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
}: UserAvailabilityTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => userAvailability.id && onSelect(userAvailability.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.dayOfWeek}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.startTime}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.endTime}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.isAvailable ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.effectiveFrom ? format(new Date(userAvailability.effectiveFrom), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.effectiveTo ? format(new Date(userAvailability.effectiveTo), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {userAvailability.timeZone}
        
      </TableCell>
      

      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={userAvailability.id || 0}
          relationshipName="user"
          currentValue={userAvailability.user}
          options={relationshipConfigs.find(config => config.name === "user")?.options || []}
          displayField="email"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "user")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="user-profiles"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="userAvailability:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/user-availabilities/${userAvailability.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userAvailability:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/user-availabilities/${userAvailability.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userAvailability:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => userAvailability.id && onDelete(userAvailability.id)}
              disabled={isDeleting || !userAvailability.id}
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
