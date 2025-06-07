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
}: CallTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => call.id && onSelect(call.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {call.callDateTime ? format(new Date(call.callDateTime), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {call.isActive ? "Yes" : "No"}
        
      </TableCell>
      

      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={call.id || 0}
          relationshipName="assignedTo"
          currentValue={call.assignedTo}
          options={relationshipConfigs.find(config => config.name === "assignedTo")?.options || []}
          displayField="login"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "assignedTo")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="users"
          showNavigationIcon={true}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={call.id || 0}
          relationshipName="area"
          currentValue={call.area}
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
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
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
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={call.id || 0}
          relationshipName="party"
          currentValue={call.party}
          options={relationshipConfigs.find(config => config.name === "party")?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={relationshipConfigs.find(config => config.name === "party")?.isEditable || false}
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="parties"
          showNavigationIcon={true}
        />
      </TableCell>
      
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
