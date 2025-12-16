'use client';

import type { TableConfig, SortConfig, ColumnConfig } from '@/entity-library/config';
import { Checkbox } from '@/components/ui/checkbox';
import { TableHead as UiTableHead, TableHeader as UiTableHeader, TableRow } from '@/components/ui/table';
import { SortableColumnHeader } from './SortableColumnHeader';

type Props<TEntity extends object> = {
  config: TableConfig<TEntity>;
  columns?: Array<ColumnConfig<TEntity>>;
  sort?: SortConfig<TEntity>;
  onSortChange?: (sort?: SortConfig<TEntity>) => void;
  selectable?: boolean;
  allSelected?: boolean;
  onToggleAll?: () => void;
};

export function TableHeader<TEntity extends object>({ config, columns, sort, onSortChange, selectable, allSelected, onToggleAll }: Props<TEntity>) {
  const cols = columns ?? config.columns;
  const hasRowActions = !!config.rowActions?.length;

  return (
    <UiTableHeader className="bg-gradient-to-r from-[oklch(0.45_0.06_243)]/5 to-transparent border-b-2 border-[oklch(0.45_0.06_243)]/20">
      <TableRow className="hover:bg-transparent">
        {selectable ? (
          <UiTableHead className="w-10">
            <Checkbox checked={!!allSelected} onCheckedChange={() => onToggleAll?.()} />
          </UiTableHead>
        ) : null}
        {cols.map((col) => (
          <UiTableHead key={String(col.field)} className="text-xs font-bold text-[oklch(0.45_0.06_243)]">
            {col.sortable ? (
              <SortableColumnHeader<TEntity> header={col.header} field={col.field} sort={sort} onSortChange={onSortChange} />
            ) : (
              <span>{col.header}</span>
            )}
          </UiTableHead>
        ))}
        {hasRowActions ? <UiTableHead className="w-10" /> : null}
      </TableRow>
    </UiTableHeader>
  );
}
