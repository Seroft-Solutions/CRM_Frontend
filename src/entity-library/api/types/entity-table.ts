import type { ReactNode } from 'react';
import type { TableConfig } from '@/entity-library/config';
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
