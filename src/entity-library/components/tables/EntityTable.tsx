'use client';

import type { ReactNode } from 'react';
import type { EntityTableProps } from '@/entity-library/types';
import { useEntityTableModel } from '../../utils/useEntityTableModel';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { TableActions } from './TableActions';
import { TableContainer } from './TableContainer';
import { TableFilters } from './TableFilters';
import { TablePagination } from './TablePagination';
import { EntityTableTable } from './EntityTableTable';
import { EntityTableToolbar } from './EntityTableToolbar';

export function EntityTable<TEntity extends object>({
  title,
  config,
  rows,
  total,
  getRowId,
  onStateChange,
  actions: externalActions,
  toolbar,
  toolbarTheme = 'default',
}: EntityTableProps<TEntity>) {
  const m = useEntityTableModel({ config, rows, getRowId, onStateChange });
  const cv = useColumnVisibility(config);
  const columns = cv.visibleColumns;
  const showColumnMenu = config.columnVisibility?.userConfigurable !== false;

  const actions: ReactNode =
    showColumnMenu || externalActions || toolbar ? (
      <EntityTableToolbar<TEntity>
        toolbar={toolbar}
        externalActions={externalActions}
        columns={config.columns}
        hidden={cv.hidden}
        onToggle={(field) =>
          cv.setHidden((prev) => ({ ...prev, [String(field)]: !prev[String(field)] }))
        }
        showColumnMenu={showColumnMenu}
        theme={toolbarTheme}
      />
    ) : undefined;

  return (
    <TableContainer title={title} actions={actions}>
      <TableActions actions={config.bulkActions} selectedRows={m.selectedRows} />
      <TableFilters
        columns={columns}
        filters={m.state.filters}
        onChange={(f) => (m.setPage(1), m.setFilters(f))}
      />
      <EntityTableTable
        config={config}
        columns={columns}
        rows={rows}
        sort={m.state.sort}
        selectable={m.selectable}
        allSelected={m.allSelected}
        onToggleAll={() => m.toggleAll(m.rowIds)}
        onSortChange={(s) => (m.setPage(1), m.setSort(s))}
        selectedIds={m.state.selectedIds}
        getRowId={getRowId}
        onToggleRow={m.toggleSelected}
      />
      <TablePagination
        pagination={config.pagination}
        page={m.state.page}
        pageSize={m.state.pageSize}
        total={total}
        onPageChange={(p) => (m.setSelectedIds([]), m.setPage(p))}
        onPageSizeChange={(s) => (m.setSelectedIds([]), m.setPage(1), m.setPageSize(s))}
      />
    </TableContainer>
  );
}
