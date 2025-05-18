import { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';

/**
 * Interface for the Zustand store used by EntityDataTable
 * Defines the state and methods that can be used to interact with the table
 */
export interface EntityTableStore<TData> {
  // Table state
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  selectedItems: TData[];
  isLoading?: boolean;
  
  // Methods to update table state
  setSorting: (sorting: SortingState) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
  setSelectedItems: (items: TData[]) => void;
  setLoading?: (isLoading: boolean) => void;
}
