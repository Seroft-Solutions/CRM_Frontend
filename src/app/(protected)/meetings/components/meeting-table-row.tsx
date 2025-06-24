'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/components/auth/permission-guard';
import { RelationshipCell } from './relationship-cell';
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
    newValue: number | null
  ) => Promise<void>;
  isUpdating?: boolean;
}

export function MeetingTableRow({
  meeting,
  onDelete,
  isDeleting,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
}: MeetingTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox checked={isSelected} onCheckedChange={() => meeting.id && onSelect(meeting.id)} />
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">
        {meeting.meetingDateTime ? format(new Date(meeting.meetingDateTime), 'PPP') : ''}
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.duration}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.title}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.description}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.meetingUrl}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.googleCalendarEventId}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.notes}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">
        {meeting.isRecurring ? 'Yes' : 'No'}
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.timeZone}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.meetingStatus}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{meeting.meetingType}</TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">
        {meeting.createdAt ? format(new Date(meeting.createdAt), 'PPP') : ''}
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">
        {meeting.updatedAt ? format(new Date(meeting.updatedAt), 'PPP') : ''}
      </TableCell>

      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={meeting.id || 0}
          relationshipName="organizer"
          currentValue={meeting.organizer}
          options={relationshipConfigs.find((config) => config.name === 'organizer')?.options || []}
          displayField="email"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={
            relationshipConfigs.find((config) => config.name === 'organizer')?.isEditable || false
          }
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="user-profiles"
          showNavigationIcon={true}
        />
      </TableCell>

      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={meeting.id || 0}
          relationshipName="assignedParty"
          currentValue={meeting.assignedParty}
          options={
            relationshipConfigs.find((config) => config.name === 'assignedParty')?.options || []
          }
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={
            relationshipConfigs.find((config) => config.name === 'assignedParty')?.isEditable ||
            false
          }
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="parties"
          showNavigationIcon={true}
        />
      </TableCell>

      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={meeting.id || 0}
          relationshipName="call"
          currentValue={meeting.call}
          options={relationshipConfigs.find((config) => config.name === 'call')?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={
            relationshipConfigs.find((config) => config.name === 'call')?.isEditable || false
          }
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="calls"
          showNavigationIcon={true}
        />
      </TableCell>

      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="meeting:read">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
              <Link href={`/meetings/${meeting.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meeting:update">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
              <Link href={`/meetings/${meeting.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="meeting:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => meeting.id && onDelete(meeting.id)}
              disabled={isDeleting || !meeting.id}
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
