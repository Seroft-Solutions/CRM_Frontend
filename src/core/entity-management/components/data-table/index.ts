// Main component
export { EntityDataTable } from './EntityDataTable';
export type { EntityDataTableProps } from './EntityDataTable';

// Context 
export { TableContext, TableProvider, useTableContext } from './context/TableContext';

// Hooks
export { useTableState } from './hooks/useTableState';

// Components (explicit exports)
export { TableControls } from './components/TableControls';
export { TableContent } from './components/TableContent';
export { TableHeader } from './components/TableHeader';
export { TablePagination } from './components/TablePagination';
export { BulkActions, RowActions } from './components/TableUtils';

// Store adapter
export { createStoreAdapter } from './adapters/storeAdapter';
export type { TableStoreAdapter } from './adapters/storeAdapter';
