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
import type { DistrictDTO } from '@/core/api/generated/spring/schemas/DistrictDTO';

interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface DistrictTableRowProps {
  district: DistrictDTO;
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

export function DistrictTableRow({
  district,
  onDelete,
  isDeleting,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  isUpdating = false,
}: DistrictTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => district.id && onSelect(district.id)}
        />
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 py-2">{district.name}</TableCell>

      <TableCell className="whitespace-nowrap px-1 py-2">
        <RelationshipCell
          entityId={district.id || 0}
          relationshipName="state"
          currentValue={district.state}
          options={relationshipConfigs.find((config) => config.name === 'state')?.options || []}
          displayField="name"
          onUpdate={onRelationshipUpdate || (() => Promise.resolve())}
          isEditable={
            relationshipConfigs.find((config) => config.name === 'state')?.isEditable || false
          }
          isLoading={isUpdating}
          className="min-w-[150px]"
          relatedEntityRoute="states"
          showNavigationIcon={true}
        />
      </TableCell>

      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="district:read">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
              <Link href={`/districts/${district.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="district:update">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
              <Link href={`/districts/${district.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="district:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => district.id && onDelete(district.id)}
              disabled={isDeleting || !district.id}
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
