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
import type { MeetingParticipantDTO } from "@/core/api/generated/spring/schemas/MeetingParticipantDTO";



interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface MeetingParticipantTableRowProps {
  meetingParticipant: MeetingParticipantDTO;
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

export function MeetingParticipantTableRow({ 
  meetingParticipant, 
  onDelete, 
  isDeleting, 
  isSelected, 
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: MeetingParticipantTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => meetingParticipant.id && onSelect(meetingParticipant.id)}
        />
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell key={column.id} className="whitespace-nowrap px-3 py-2">
          {column.type === 'field' ? (
            // Render field column
            (() => {
              const field = meetingParticipant[column.accessor as keyof typeof meetingParticipant];
              
              if (column.id === 'email') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'name') {
                
                return field?.toString() || "";
                
              }
              
              if (column.id === 'isRequired') {
                
                return field ? "Yes" : "No";
                
              }
              
              if (column.id === 'hasAccepted') {
                
                return field ? "Yes" : "No";
                
              }
              
              if (column.id === 'hasDeclined') {
                
                return field ? "Yes" : "No";
                
              }
              
              if (column.id === 'responseDateTime') {
                
                return field ? format(new Date(field as string), "PPP") : "";
                
              }
              
              return field?.toString() || "";
            })()
          ) : (
            // Render relationship column
            (() => {
              
              if (column.id === 'meeting') {
                return (
                  <RelationshipCell
                    entityId={meetingParticipant.id || 0}
                    relationshipName="meeting"
                    currentValue={meetingParticipant.meeting}
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
          <InlinePermissionGuard requiredPermission="meetingParticipant:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/meeting-participants/${meetingParticipant.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meetingParticipant:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/meeting-participants/${meetingParticipant.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meetingParticipant:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => meetingParticipant.id && onDelete(meetingParticipant.id)}
              disabled={isDeleting || !meetingParticipant.id}
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
