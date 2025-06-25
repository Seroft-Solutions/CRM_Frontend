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
import type { MeetingReminderDTO } from "@/core/api/generated/spring/schemas/MeetingReminderDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface MeetingReminderTableRowProps {
  meetingReminder: MeetingReminderDTO;
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

export function MeetingReminderTableRow({ 
  meetingReminder, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: MeetingReminderTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => meetingReminder.id && onSelect(meetingReminder.id)}
        />
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell key={column.id} className="whitespace-nowrap px-3 py-2">
          {column.type === 'field' ? (
            // Render field column
            (() => {
              const field = meetingReminder[column.accessor as keyof typeof meetingReminder];
              
              if (column.id === 'reminderType') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'reminderMinutesBefore') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'isTriggered') {
                
                return field ? "Yes" : "No";
                
              }
              
              if (column.id === 'triggeredAt') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              if (column.id === 'failureReason') {
                
                return field?.toString() || "";
                
              }
              
              return field?.toString() || "";
            })()
          ) : (
            // Render relationship column
            (() => {
              
              if (column.id === 'meeting') {
                return (
                  <RelationshipCell
                    entityId={meetingReminder.id || 0}
                    relationshipName="meeting"
                    currentValue={meetingReminder.meeting}
                    options={relationshipConfigs.find(config => config.name === "meeting")?.options || []}
                    displayField="name"
                    onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                    isEditable={relationshipConfigs.find(config => config.name === "meeting")?.isEditable || false}
                    isLoading={isUpdating}
                    className="min-w-[150px]"
                    relatedEntityRoute="meetings"
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
          <InlinePermissionGuard requiredPermission="meetingReminder:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/meeting-reminders/${meetingReminder.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meetingReminder:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/meeting-reminders/${meetingReminder.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meetingReminder:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => meetingReminder.id && onDelete(meetingReminder.id)}
              disabled={isDeleting || !meetingReminder.id}
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
