'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Archive } from 'lucide-react';
import Link from 'next/link';
import { SystemConfigDTO } from '@/core/api/generated/spring/schemas/SystemConfigDTO';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

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
}

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigTableRow({ item, columns, onArchive }: SystemConfigTableRowProps) {
  return (
    <TableRow>
      {columns.map((column) => {
        const value = item[column.accessor as keyof SystemConfigDTO];
        const displayValue =
          column.accessor === 'systemConfigType' || column.accessor === 'status'
            ? transformEnumValue(value as string)
            : (value as string | number) || '-';

        return <TableCell key={column.id}>{displayValue}</TableCell>;
      })}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/system-configs/${item.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/system-configs/${item.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => item.id && onArchive(item.id)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
