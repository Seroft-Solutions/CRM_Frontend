import type { ReactNode } from 'react';
import type { SortConfig, TableConfig } from '@/entity-library/config';
import type { EntityId } from './common';
import type { TableState } from './table';

export interface EntityTableProps<TEntity extends object> {
  title?: string;
  config: TableConfig<TEntity>;
  rows: TEntity[];
  total?: number;
  getRowId: (row: TEntity) => EntityId;
  onStateChange?: (state: TableState<TEntity>) => void;
  actions?: ReactNode;
  toolbar?: ReactNode;
}

export interface EntityTableTableProps<TEntity extends object> {
  config: TableConfig<TEntity>;
  rows: TEntity[];
  sort?: SortConfig<TEntity>;
  selectable: boolean;
  allSelected: boolean;
  onSortChange: (sort?: SortConfig<TEntity>) => void;
  onToggleAll: () => void;
  selectedIds: EntityId[];
  getRowId: (row: TEntity) => EntityId;
  onToggleRow: (id: EntityId) => void;
}

export type EntityTableContentProps<TEntity extends object> =
  EntityTableTableProps<TEntity>;
