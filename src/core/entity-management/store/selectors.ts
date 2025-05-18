import { EntityState } from './types';
import { FormMode } from '@/features/core/tanstack-query-api';
import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

export interface FormStateSelector<TData> {
  isModalOpen: boolean;
  formMode: FormMode;
  selectedItem: TData | null;
  formData: Partial<TData>;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface TableStateSelector<TData> {
  items: TData[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
}

export interface SelectionStateSelector<TData> {
  selectedItems: TData[];
  selectedIds: string[];
}

export interface FilterStateSelector<TFilter> {
  filters: TFilter;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  searchQuery: string;
  searchColumn: string;
  sorting: SortingState;
}

/**
 * Type-safe selector creator with memoization support
 */
export const createSelectors = <TData extends Record<string, any>, TFilter extends Record<string, any>>() => {
  // Form state selector
  const selectFormState = (state: EntityState<TData, TFilter>): FormStateSelector<TData> => ({
    isModalOpen: state.isModalOpen,
    formMode: state.formMode,
    selectedItem: state.selectedItem,
    formData: state.formData,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError
  });

  // Table state selector
  const selectTableState = (state: EntityState<TData, TFilter>): TableStateSelector<TData> => ({
    items: state.items,
    totalItems: state.totalItems,
    totalPages: state.totalPages,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    isLoading: state.isLoading,
    error: state.error
  });

  // Selection state selector
  const selectSelectionState = (state: EntityState<TData, TFilter>): SelectionStateSelector<TData> => ({
    selectedItems: state.selectedItems,
    selectedIds: state.selectedIds
  });

  // Filter state selector
  const selectFilterState = (state: EntityState<TData, TFilter>): FilterStateSelector<TFilter> => ({
    filters: state.filters,
    columnFilters: state.columnFilters,
    columnVisibility: state.columnVisibility,
    globalFilter: state.globalFilter,
    searchQuery: state.searchQuery,
    searchColumn: state.searchColumn,
    sorting: state.sorting
  });

  // Individual field selectors for fine-grained updates
  const selectItems = (state: EntityState<TData, TFilter>) => state.items;
  const selectFormData = (state: EntityState<TData, TFilter>) => state.formData;
  const selectSelectedItem = (state: EntityState<TData, TFilter>) => state.selectedItem;
  const selectIsLoading = (state: EntityState<TData, TFilter>) => state.isLoading;
  const selectError = (state: EntityState<TData, TFilter>) => state.error;
  const selectFilters = (state: EntityState<TData, TFilter>) => state.filters;
  const selectSorting = (state: EntityState<TData, TFilter>) => state.sorting;
  const selectPagination = (state: EntityState<TData, TFilter>) => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalItems: state.totalItems,
    totalPages: state.totalPages
  });

  return {
    // Slice selectors
    selectFormState,
    selectTableState,
    selectSelectionState,
    selectFilterState,
    
    // Individual field selectors
    selectItems,
    selectFormData,
    selectSelectedItem,
    selectIsLoading,
    selectError,
    selectFilters,
    selectSorting,
    selectPagination,
    
    // Utility selector creator for custom selections
    createCustomSelector: <T>(selector: (state: EntityState<TData, TFilter>) => T) => selector
  };
};