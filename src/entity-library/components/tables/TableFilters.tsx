'use client';

import type { TableConfig } from '@/entity-library/config';
import type { ColumnConfig } from '@/entity-library/config';
import { TableFiltersPanel } from './TableFiltersPanel';

export function TableFilters<TEntity extends object>({
  config,
  columns,
  filters,
  onChange,
}: {
  config: TableConfig<TEntity>;
  columns: Array<ColumnConfig<TEntity>>;
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const filterable = columns.filter((c) => c.filterable);

  if (filterable.length === 0) return null;

  return <TableFiltersPanel<TEntity> columns={filterable} filters={filters} onChange={onChange} />;
}
