import type { SortConfig, TableConfig } from '@/entity-library/config';
import type { EntityId } from '@/entity-library/types';

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
