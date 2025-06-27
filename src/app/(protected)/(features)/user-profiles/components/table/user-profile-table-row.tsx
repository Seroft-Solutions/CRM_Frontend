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
import type { UserProfileDTO } from "@/core/api/generated/spring/schemas/UserProfileDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface UserProfileTableRowProps {
  userProfile: UserProfileDTO;
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

export function UserProfileTableRow({ 
  userProfile, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: UserProfileTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => userProfile.id && onSelect(userProfile.id)}
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
              const field = userProfile[column.accessor as keyof typeof userProfile];
              
              if (column.id === 'keycloakId') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'phone') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'displayName') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'createdAt') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              if (column.id === 'updatedAt') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              return field?.toString() || "";
            })()
          ) : (
            // Render relationship column
            (() => {
              
              if (column.id === 'user') {
                return (
                  <RelationshipCell
                    entityId={userProfile.id || 0}
                    relationshipName="user"
                    currentValue={userProfile.user}
                    options={relationshipConfigs.find(config => config.name === "user")?.options || []}
                    displayField="login"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "user")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="users"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'channelType') {
                return (
                  <RelationshipCell
                    entityId={userProfile.id || 0}
                    relationshipName="channelType"
                    currentValue={userProfile.channelType}
                    options={relationshipConfigs.find(config => config.name === "channelType")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "channelType")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="channel-types"
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
          <InlinePermissionGuard requiredPermission="userProfile:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/user-profiles/${userProfile.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userProfile:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            >
              <Link href={`/user-profiles/${userProfile.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userProfile:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
              onClick={() => userProfile.id && onDelete(userProfile.id)}
              disabled={isDeleting || !userProfile.id}
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
