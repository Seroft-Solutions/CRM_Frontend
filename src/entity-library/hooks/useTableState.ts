'use client';

import { useMemo, useState } from 'react';
import type { SortConfig, TableConfig } from '@/entity-library/config';
import type { EntityId, TableState } from '@/entity-library/types';

export function useTableState<TEntity extends object>(config: TableConfig<TEntity>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [sort, setSort] = useState<SortConfig<TEntity> | undefined>(config.defaultSort);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<EntityId[]>([]);

  const state: TableState<TEntity> = useMemo(
    () => ({ page, pageSize, sort, filters, selectedIds }),
    [filters, page, pageSize, selectedIds, sort]
  );

  const toggleSelected = (id: EntityId) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = (ids: EntityId[]) =>
    setSelectedIds((prev) => (ids.length && ids.every((id) => prev.includes(id)) ? [] : ids));

  return {
    state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    toggleSelected,
    toggleAll,
    setSelectedIds,
  };
}
