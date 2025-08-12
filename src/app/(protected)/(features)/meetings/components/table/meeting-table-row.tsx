// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { RelationshipCell } from '@/app/(protected)/(features)/meetings/components/table/relationship-cell';
import type { MeetingDTO } from '@/core/api/generated/spring/schemas/MeetingDTO';

interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface MeetingTableRowProps {
  meeting: MeetingDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (
    entityId: number,
    relationshipName: string,
    newValue: number | null,
    isBulkOperation?: boolean
  ) => Promise<void>;
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

export function MeetingTableRow({
  meeting,
  onDelete,
  isDeleting,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: MeetingTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox checked={isSelected} onCheckedChange={() => meeting.id && onSelect(meeting.id)} />
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
          {column.type === 'field'
            ? // Render field column
              (() => {
                const field = meeting[column.accessor as keyof typeof meeting];

                if (column.id === 'meetingDateTime') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'duration') {
                  return field?.toString() || '';
                }

                if (column.id === 'title') {
                  return field?.toString() || '';
                }

                if (column.id === 'description') {
                  return field?.toString() || '';
                }

                if (column.id === 'meetingUrl') {
                  return field?.toString() || '';
                }

                if (column.id === 'googleCalendarEventId') {
                  return field?.toString() || '';
                }

                if (column.id === 'notes') {
                  return field?.toString() || '';
                }

                if (column.id === 'isRecurring') {
                  return field ? 'Yes' : 'No';
                }

                if (column.id === 'timeZone') {
                  return field?.toString() || '';
                }

                if (column.id === 'meetingStatus') {
                  return field?.toString() || '';
                }

                if (column.id === 'meetingType') {
                  return field?.toString() || '';
                }

                if (column.id === 'createdAt') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'updatedAt') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'createdBy') {
                  return field?.toString() || '';
                }

                if (column.id === 'createdDate') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'lastModifiedBy') {
                  return field?.toString() || '';
                }

                if (column.id === 'lastModifiedDate') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                return field?.toString() || '';
              })()
            : // Render relationship column
              (() => {
                if (column.id === 'organizer') {
                  const cellKey = `${meeting.id}-organizer`;
                  return (
                    <RelationshipCell
                      entityId={meeting.id || 0}
                      relationshipName="organizer"
                      currentValue={meeting.organizer}
                      options={
                        relationshipConfigs.find((config) => config.name === 'organizer')
                          ?.options || []
                      }
                      displayField="displayName"
                      onUpdate={(entityId, relationshipName, newValue) =>
                        onRelationshipUpdate
                          ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                          : Promise.resolve()
                      }
                      isEditable={
                        relationshipConfigs.find((config) => config.name === 'organizer')
                          ?.isEditable || false
                      }
                      isLoading={updatingCells.has(cellKey)}
                      className="min-w-[150px]"
                      relatedEntityRoute="user-profiles"
                      showNavigationIcon={true}
                    />
                  );
                }

                if (column.id === 'assignedCustomer') {
                  const cellKey = `${meeting.id}-assignedCustomer`;
                  return (
                    <RelationshipCell
                      entityId={meeting.id || 0}
                      relationshipName="assignedCustomer"
                      currentValue={meeting.assignedCustomer}
                      options={
                        relationshipConfigs.find((config) => config.name === 'assignedCustomer')
                          ?.options || []
                      }
                      displayField="customerBusinessName"
                      onUpdate={(entityId, relationshipName, newValue) =>
                        onRelationshipUpdate
                          ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                          : Promise.resolve()
                      }
                      isEditable={
                        relationshipConfigs.find((config) => config.name === 'assignedCustomer')
                          ?.isEditable || false
                      }
                      isLoading={updatingCells.has(cellKey)}
                      className="min-w-[150px]"
                      relatedEntityRoute="customers"
                      showNavigationIcon={true}
                    />
                  );
                }

                if (column.id === 'call') {
                  const cellKey = `${meeting.id}-call`;
                  return (
                    <RelationshipCell
                      entityId={meeting.id || 0}
                      relationshipName="call"
                      currentValue={meeting.call}
                      options={
                        relationshipConfigs.find((config) => config.name === 'call')?.options || []
                      }
                      displayField="name"
                      onUpdate={(entityId, relationshipName, newValue) =>
                        onRelationshipUpdate
                          ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                          : Promise.resolve()
                      }
                      isEditable={
                        relationshipConfigs.find((config) => config.name === 'call')?.isEditable ||
                        false
                      }
                      isLoading={updatingCells.has(cellKey)}
                      className="min-w-[150px]"
                      relatedEntityRoute="calls"
                      showNavigationIcon={true}
                    />
                  );
                }

                return null;
              })()}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[100px] sm:w-[120px]">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="meeting:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/meetings/${meeting.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meeting:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/meetings/${meeting.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meeting:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
              onClick={() => meeting.id && onDelete(meeting.id)}
              disabled={isDeleting || !meeting.id}
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
