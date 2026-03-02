import type { BulkActionConfig, RowActionConfig } from './actions';
import type { ColumnConfig } from './column-config';
import type { ColumnVisibilityConfig } from './column-visibility';
import type { EmptyStateConfig } from './empty-state';
import type { PaginationConfig } from './pagination-config';
import type { RowSelectionConfig } from './row-selection';
import type { SortConfig } from './sort-config';

export interface TableConfig<TEntity extends object> {
  columns: Array<ColumnConfig<TEntity>>;
  defaultSort?: SortConfig<TEntity>;
  pagination: PaginationConfig;
  rowActions?: Array<RowActionConfig<TEntity>>;
  bulkActions?: Array<BulkActionConfig<TEntity>>;
  columnVisibility?: ColumnVisibilityConfig<TEntity>;
  rowSelection?: RowSelectionConfig;
  emptyState?: EmptyStateConfig;
}
