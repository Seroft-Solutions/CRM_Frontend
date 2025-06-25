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
import type { CallDTO } from "@/core/api/generated/spring/schemas/CallDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface CallTableRowProps {
  call: CallDTO;
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

export function CallTableRow({ 
  call, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: CallTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => call.id && onSelect(call.id)}
        />
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell key={column.id} className="whitespace-nowrap px-3 py-2">
          {column.type === 'field' ? (
            // Render field column
            (() => {
              const field = call[column.accessor as keyof typeof call];
              
              if (column.id === 'callDateTime') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              return field?.toString() || "";
            })()
          ) : (
            // Render relationship column
            (() => {
              
              if (column.id === 'priority') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="priority"
                    currentValue={call.priority}
                    options={relationshipConfigs.find(config => config.name === "priority")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "priority")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="priorities"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'callType') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="callType"
                    currentValue={call.callType}
                    options={relationshipConfigs.find(config => config.name === "callType")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "callType")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="call-types"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'subCallType') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="subCallType"
                    currentValue={call.subCallType}
                    options={relationshipConfigs.find(config => config.name === "subCallType")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "subCallType")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="sub-call-types"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'callCategory') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="callCategory"
                    currentValue={call.callCategory}
                    options={relationshipConfigs.find(config => config.name === "callCategory")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "callCategory")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="call-categories"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'source') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="source"
                    currentValue={call.source}
                    options={relationshipConfigs.find(config => config.name === "source")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "source")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="sources"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'customer') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="customer"
                    currentValue={call.customer}
                    options={relationshipConfigs.find(config => config.name === "customer")?.options || []}
                    displayField="customerBusinessName"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "customer")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="customers"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'channelType') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="channelType"
                    currentValue={call.channelType}
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
              
              if (column.id === 'channelParties') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="channelParties"
                    currentValue={call.channelParties}
                    options={relationshipConfigs.find(config => config.name === "channelParties")?.options || []}
                    displayField="displayName"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "channelParties")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="user-profiles"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'assignedTo') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="assignedTo"
                    currentValue={call.assignedTo}
                    options={relationshipConfigs.find(config => config.name === "assignedTo")?.options || []}
                    displayField="displayName"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "assignedTo")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="user-profiles"
                    showNavigationIcon={true}
                  />
                );
              }
              
              if (column.id === 'callStatus') {
                return (
                  <RelationshipCell
                    entityId={call.id || 0}
                    relationshipName="callStatus"
                    currentValue={call.callStatus}
                    options={relationshipConfigs.find(config => config.name === "callStatus")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "callStatus")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="call-statuses"
                    showNavigationIcon={true}
                  />
                );
              }
              
              return null;
            })()
          )}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="call:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/calls/${call.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="call:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/calls/${call.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="call:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => call.id && onDelete(call.id)}
              disabled={isDeleting || !call.id}
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
