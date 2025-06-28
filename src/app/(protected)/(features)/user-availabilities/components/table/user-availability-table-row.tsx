'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { RelationshipCell } from './relationship-cell';
import type { UserAvailabilityDTO } from '@/core/api/generated/spring/schemas/UserAvailabilityDTO';

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
  onRelationshipUpdate?: (
    entityId: number,
    relationshipName: string,
    newValue: number | null
  ) => Promise<void>;
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

export function UserAvailabilityTableRow({
  userAvailability,
  onDelete,
  isDeleting,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
  visibleColumns,
}: UserAvailabilityTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => userAvailability.id && onSelect(userAvailability.id)}
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
          {column.type === 'field'
            ? // Render field column
              (() => {
                const field = userAvailability[column.accessor as keyof typeof userAvailability];

                if (column.id === 'dayOfWeek') {
                  return field?.toString() || '';
                }

                if (column.id === 'startTime') {
                  return field?.toString() || '';
                }

                if (column.id === 'endTime') {
                  return field?.toString() || '';
                }

                if (column.id === 'isAvailable') {
                  return field ? 'Yes' : 'No';
                }

                if (column.id === 'effectiveFrom') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'effectiveTo') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'timeZone') {
                  return field?.toString() || '';
                }

                return field?.toString() || '';
              })()
            : // Render relationship column
              (() => {
                if (column.id === 'user') {
                  return (
                    <RelationshipCell
                      entityId={userAvailability.id || 0}
                      relationshipName="user"
                      currentValue={userAvailability.user}
                      options={
                        relationshipConfigs.find((config) => config.name === 'user')?.options || []
                      }
                      displayField="displayName"
                      onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
                      isEditable={
                        relationshipConfigs.find((config) => config.name === 'user')?.isEditable ||
                        false
                      }
                      isLoading={isUpdating}
                      className="min-w-[150px]"
                      relatedEntityRoute="user-profiles"
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
          <InlinePermissionGuard requiredPermission="userAvailability:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/user-availabilities/${userAvailability.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userAvailability:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/user-availabilities/${userAvailability.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="userAvailability:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
              onClick={() => userAvailability.id && onDelete(userAvailability.id)}
              disabled={isDeleting || !userAvailability.id}
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
