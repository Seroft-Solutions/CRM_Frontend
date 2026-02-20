'use client';

import { TableCell } from './TableCell';
import type { TableConfig, ColumnConfig } from '@/entity-library/config';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell as UiTableCell, TableRow as UiTableRow } from '@/components/ui/table';
import { TableRowActions } from './TableRowActions';

export function TableRow<TEntity extends object>({
  config,
  columns,
  row,
  selected,
  selectable,
  onToggle,
}: {
  config: TableConfig<TEntity>;
  columns?: Array<ColumnConfig<TEntity>>;
  row: TEntity;
  selected?: boolean;
  selectable?: boolean;
  onToggle?: () => void;
}) {
  const cols = columns ?? config.columns;
  const actions = config.rowActions ?? [];

  return (
    <UiTableRow data-state={selected ? 'selected' : undefined}>
      {selectable ? (
        <UiTableCell className="w-10">
          <Checkbox checked={!!selected} onCheckedChange={() => onToggle?.()} />
        </UiTableCell>
      ) : null}
      {cols.map((col, index) => (
        <UiTableCell key={`${String(col.field)}-${index}`} className="text-sm">
          <TableCell column={col} row={row} />
        </UiTableCell>
      ))}
      {actions.length ? (
        <UiTableCell className="w-10 text-right">
          <TableRowActions actions={actions} row={row} />
        </UiTableCell>
      ) : null}
    </UiTableRow>
  );
}
