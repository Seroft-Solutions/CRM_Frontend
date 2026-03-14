import type { SortConfig } from '@/entity-library/config';
import type { EntityId } from './common';

export interface TableState<TEntity extends object> {
  page: number;
  pageSize: number;
  sort?: SortConfig<TEntity>;
  filters: Record<string, string>;
  selectedIds: EntityId[];
}
