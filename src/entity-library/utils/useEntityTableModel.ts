'use client';

import { useEffect, useMemo } from 'react';
import type { TableConfig } from '@/entity-library/config';
import type { EntityId, TableState } from '@/entity-library/types';
import { useTableState } from '@/entity-library/hooks/useTableState';

export function useEntityTableModel<TEntity extends object>({
  config,
  rows,
  getRowId,
  onStateChange,
}: {
  config: TableConfig<TEntity>;
  rows: TEntity[];
  getRowId: (row: TEntity) => EntityId;
  onStateChange?: (state: TableState<TEntity>) => void;
}) {
  const api = useTableState(config);

  useEffect(() => onStateChange?.(api.state), [api.state, onStateChange]);

  const selectable = config.rowSelection?.enabled ?? !!config.bulkActions?.length;
  const rowIds = useMemo(() => rows.map(getRowId), [getRowId, rows]);
  const allSelected =
    selectable && rowIds.length > 0 && rowIds.every((id) => api.state.selectedIds.includes(id));
  const selectedRows = useMemo(
    () => rows.filter((r) => api.state.selectedIds.includes(getRowId(r))),
    [api.state.selectedIds, getRowId, rows]
  );

  return { ...api, selectable, rowIds, allSelected, selectedRows };
}
