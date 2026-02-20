'use client';

import type { TableConfig, ColumnConfig } from '@/entity-library/config';
import type { EntityId } from '@/entity-library/types';
import { TableRow } from './TableRow';
import { TableBody } from '@/components/ui/table';

export function EntityTableBody<TEntity extends object>({
  config,
  columns,
  rows,
  getRowId,
  selectable,
  selectedIds,
  onToggleRow,
}: {
  config: TableConfig<TEntity>;
  columns: Array<ColumnConfig<TEntity>>;
  rows: TEntity[];
  getRowId: (row: TEntity) => EntityId;
  selectable: boolean;
  selectedIds: EntityId[];
  onToggleRow: (id: EntityId) => void;
}) {
  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={String(getRowId(row))}
          config={config}
          columns={columns}
          row={row}
          selectable={selectable}
          selected={selectedIds.includes(getRowId(row))}
          onToggle={() => onToggleRow(getRowId(row))}
        />
      ))}
    </TableBody>
  );
}
