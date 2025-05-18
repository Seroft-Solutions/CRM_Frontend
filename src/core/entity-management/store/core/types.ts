import { FormMode } from '@/features/core/tanstack-query-api';
import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

// Core state interfaces
export interface EntityBaseState<TData, TFilter> extends
  FormState<TData>,
  TableState<TData>,
  SelectionState<TData>,
  FilterState<TFilter>,
  UpdateTracking {}

export interface EntityState<TData, TFilter> extends
  EntityBaseState<TData, TFilter>,
  EntityStoreActions<TData, TFilter> {}

export interface EntityStoreActions<TData, TFilter> {
  // Form actions
  openModal: (mode: FormMode, item?: TData | null) => void;
  closeModal: () => void;
  setFormMode: (mode: FormMode) => void;
  setSelectedItem: (item: TData | null) => void;
  updateFormData: (data: Partial<TData>) => void;
  resetFormData: (defaultValues?: Partial<TData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error: string | null) => void;

  // Table actions
  setItems: (items: TData[]) => void;
  setTotalItems: (totalItems: number) => void;
  setTotalPages: (totalPages: number) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;

  // Selection actions
  setSelectedItems: (items: TData[]) => void;
  setSelectedIds: (ids: string[]) => void;

  // Filter/Sort actions
  setSorting: (sorting: SortingState) => void;
  setFilters: (filters: Partial<TFilter>) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
  setGlobalFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchColumn: (column: string) => void;

  // Reset actions
  resetFilters: () => void;
  resetPagination: () => void;
  resetTable: () => void;
  reset: () => void;
}

export interface FormState<TData> {
  isModalOpen: boolean;
  formMode: FormMode;
  selectedItem: TData | null;
  formData: Partial<TData>;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface TableState<TData> {
  items: TData[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
}

export interface SelectionState<TData> {
  selectedItems: TData[];
  selectedIds: string[];
}

export interface FilterState<TFilter> {
  filters: TFilter;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  searchQuery: string;
  searchColumn: string;
  sorting: SortingState;
}

export interface UpdateTracking {
  lastUpdateTime: number;
}

// Core store configuration types
export interface EntityStoreConfig<TFilter> {
  storeId?: string;
  defaultPageSize?: number;
  defaultSearchColumn?: string;
  defaultFilters?: TFilter;
  persist?: boolean;
  enableLogging?: boolean;
  updateThreshold?: number;
}

export type PersistedState<TFilter> = {
  pageSize: number;
  columnVisibility: VisibilityState;
  filters: TFilter;
  sorting: any[];
};