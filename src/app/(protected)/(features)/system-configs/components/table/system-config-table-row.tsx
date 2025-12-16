'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Archive, Eye, MoreVertical, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { SystemConfigDTO } from '@/core/api/generated/spring/schemas/SystemConfigDTO';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InlinePermissionGuard } from '@/core/auth';

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

interface SystemConfigTableRowProps {
  item: SystemConfigDTO;
  columns: ColumnConfig[];
  onArchive: (id: number) => void;
  onStatusChange: (id: number, status: SystemConfigDTOStatus) => void;
  isUpdatingStatus?: boolean;
}

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigTableRow({
  item,
  columns,
  onArchive,
  onStatusChange,
  isUpdatingStatus,
}: SystemConfigTableRowProps) {
  const currentStatus = item.status as SystemConfigDTOStatus | undefined;

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      {columns.map((column) => {
        const value = item[column.accessor as keyof SystemConfigDTO];
        const displayValue =
          column.accessor === 'systemConfigType' || column.accessor === 'status'
            ? transformEnumValue(value as string)
            : (value as string | number) || '-';

        return (
          <TableCell key={column.id} className="px-2 sm:px-3 py-2">
            {displayValue}
          </TableCell>
        );
      })}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="systemConfig:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/system-configs/${item.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          <InlinePermissionGuard requiredPermission="systemConfig:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/system-configs/${item.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="systemConfig:update">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  disabled={isUpdatingStatus}
                >
                  <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Status Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentStatus !== SystemConfigDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => item.id && onStatusChange(item.id, SystemConfigDTOStatus.ACTIVE)}
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== SystemConfigDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() =>
                      item.id && onStatusChange(item.id, SystemConfigDTOStatus.INACTIVE)
                    }
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== SystemConfigDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => item.id && onArchive(item.id)}
                      className="text-red-700"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
