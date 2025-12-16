'use client';

import type { EntityTableTableProps } from '@/entity-library/types';
import type { ColumnConfig } from '@/entity-library/config';
import { EntityTableBody } from './EntityTableBody';
import { TableEmpty } from './TableEmpty';
import { TableHeader } from './TableHeader';
import { Table } from '@/components/ui/table';

export function EntityTableTable<TEntity extends object>({
  config,
  columns,
  rows,
  sort,
  selectable,
  allSelected,
  onSortChange,
  onToggleAll,
  selectedIds,
  getRowId,
  onToggleRow,
}: EntityTableTableProps<TEntity> & { columns: Array<ColumnConfig<TEntity>> }) {
  if (rows.length === 0) return <TableEmpty emptyState={config.emptyState} />;

  return (
    <Table>
      <TableHeader
        config={config}
        columns={columns}
        sort={sort}
        selectable={selectable}
        allSelected={allSelected}
        onToggleAll={onToggleAll}
        onSortChange={onSortChange}
      />
      <EntityTableBody
        config={config}
        columns={columns}
        rows={rows}
        getRowId={getRowId}
        selectable={selectable}
        selectedIds={selectedIds}
        onToggleRow={onToggleRow}
      />
    </Table>
  );
}

export function EntityTableContent<TEntity extends object>(
  props: EntityTableTableProps<TEntity>,
) {
  return <EntityTableTable {...props} columns={props.config.columns} />;
}
