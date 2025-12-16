'use client';

import type { ColumnConfig } from '@/entity-library/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Columns } from 'lucide-react';

export function TableColumnVisibility<TEntity extends object>({
  columns,
  hidden,
  onToggle,
}: {
  columns: Array<ColumnConfig<TEntity>>;
  hidden: Record<string, boolean>;
  onToggle: (field: keyof TEntity) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          <Columns className="h-4 w-4" />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
        {columns.map((c) => (
          <DropdownMenuCheckboxItem
            key={String(c.field)}
            checked={!hidden[String(c.field)]}
            onCheckedChange={() => onToggle(c.field)}
          >
            {c.header}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
