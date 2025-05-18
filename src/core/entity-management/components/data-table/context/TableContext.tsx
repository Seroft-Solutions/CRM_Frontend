import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState, 
  Table,
  Row,
  Header
} from '@tanstack/react-table';
import { 
  FilterableColumn, 
  SearchableColumn, 
  Action, 
  BulkAction,
  FilterInfo,
  SortInfo
} from '../../../types/data-table';
import { useAuth } from '@/features/core/auth';

/**
 * TableContext provides shared state and handlers for the EntityDataTable components
 */
export interface TableContextValue<TData = any, TValue = any> {
  // Table instance and core properties
  table: Table<TData>;
  data: TData[];
  
  // Table state
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  rowSelection: Record<string, boolean>;
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // Search state
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchColumn: string;
  setSearchColumn: React.Dispatch<React.SetStateAction<string>>;
  activeSearch: {column: string, query: string} | null;
  
  // Config
  columns: SearchableColumn[];
  filterableColumns: FilterableColumn[];
  searchableColumns: SearchableColumn[];
  actions: Action<TData>[];
  bulkActions: BulkAction<TData>[];
  
  // Flags
  isLoading: boolean;
  isServerSide: boolean;
  enableMultiSelect: boolean;
  enableRowClick: boolean | ((event: React.MouseEvent<HTMLTableRowElement>) => boolean);
  
  // Handlers
  handleSearch: () => void;
  resetSearch: () => void;
  handleFilterChange: (columnId: string, value: any) => void;
  handleSortingChange: (updatedSorting: SortingState) => void;
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void;
  renderHeaderCell: (header: Header<TData, unknown>) => React.ReactNode;
  hasRole: (feature: string, action: string) => boolean;
  
  // UI indicators
  activeFiltersCount: number;
  
  // Callback functions
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  onAdd?: () => void;
  onExport?: () => void;
  
  // Pagination
  defaultPageSize: number;
  totalItems?: number;
  pageCount?: number;
  currentPage: number;
  
  // Server-side callbacks
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void;
  onFilterChange?: (columnId: string, value: string) => void;
  onSearchChange?: (columnId: string, value: string) => void;
  
  // UI Properties
  title?: string;
  description?: string;
  addPermission?: { feature: string; action: string };
}

// Create the context with a default empty value
export const TableContext = createContext<TableContextValue | undefined>(undefined);

// Provider component
export interface TableContextProviderProps<TData = any, TValue = any> {
  children: ReactNode;
  value: Omit<TableContextValue<TData, TValue>, 'hasRole'>;
}

export function TableContextProvider<TData, TValue>({ 
  children, 
  value 
}: TableContextProviderProps<TData, TValue>) {
  const { hasRole } = useAuth();
  
  const contextValue = useMemo(() => ({
    ...value,
    hasRole
  }), [value, hasRole]);
  
  return (
    <TableContext.Provider value={contextValue as TableContextValue}>
      {children}
    </TableContext.Provider>
  );
}

// Custom hook to consume the context
export function useTableContext<TData = any, TValue = any>() {
  const context = useContext(TableContext);
  
  if (context === undefined) {
    throw new Error('useTableContext must be used within a TableContextProvider');
  }
  
  return context as TableContextValue<TData, TValue>;
}
