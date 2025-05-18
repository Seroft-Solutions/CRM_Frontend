import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FormMode } from '@/features/core/tanstack-query-api';
import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';
import { StoreApi, StateCreator } from 'zustand';

// Separate interfaces for different state slices to prevent circular updates
interface FormState<TData> {
  isModalOpen: boolean;
  formMode: FormMode;
  selectedItem: TData | null;
  formData: Partial<TData>;
  isSubmitting: boolean;
  submitError: string | null;
}

interface TableState<TData> {
  items: TData[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
}

interface SelectionState<TData> {
  selectedItems: TData[];
  selectedIds: string[];
}

interface FilterState<TFilter> {
  filters: TFilter;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  searchQuery: string;
  searchColumn: string;
  sorting: SortingState;
}

// Entity store state interface with strict typing
export interface EntityState<TData = any, TFilter = any> extends
  FormState<TData>,
  TableState<TData>,
  SelectionState<TData>,
  FilterState<TFilter> {
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

type EntityStoreState<TData, TFilter> = Omit<EntityState<TData, TFilter>, keyof {[K in keyof EntityState<TData, TFilter>]: EntityState<TData, TFilter>[K] extends Function ? K : never}[keyof EntityState<TData, TFilter>]>;

type UpdateFunction<T extends Record<string, any>> = (state: T) => Partial<T>;

/**
 * Creates a Zustand store for managing entity state with improved update guards and memoization
 */
export const createEntityStore = <TData extends Record<string, any>, TFilter extends Record<string, any>>(
  storeId = 'entity-store',
  options: {
    defaultPageSize?: number;
    defaultSearchColumn?: string;
    defaultFilters?: TFilter;
    persist?: boolean;
    enableLogging?: boolean;
    updateThreshold?: number;
  } = {}
) => {
  const {
    defaultPageSize = 10,
    defaultSearchColumn = '',
    defaultFilters = {} as TFilter,
    persist: shouldPersist = false,
    enableLogging = false,
    updateThreshold = 100
  } = options;

  // Initial state with update guards
  const initialState: EntityStoreState<TData, TFilter> = {
    // Form state
    isModalOpen: false,
    formMode: 'view' as FormMode,
    selectedItem: null,
    formData: {} as Partial<TData>,
    isSubmitting: false,
    submitError: null,

    // Table state
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: defaultPageSize,
    isLoading: false,
    error: null,

    // Selection state
    selectedItems: [],
    selectedIds: [],

    // Filter state
    filters: defaultFilters,
    columnFilters: [],
    columnVisibility: {},
    globalFilter: '',
    searchQuery: '',
    searchColumn: defaultSearchColumn,
    sorting: []
  };

  // Store creator with proper types
  const createStore: StateCreator<
    EntityState<TData, TFilter>, 
    [["zustand/devtools", never]], 
    [],
    EntityState<TData, TFilter>
  > = (set, get) => {
    // Memoized update helper with improved batching and debouncing
    const safeUpdate = (
      fn: UpdateFunction<EntityStoreState<TData, TFilter>>,
      actionType: string
    ) => {
      const state = get();
      const now = Date.now();
      const timeSinceLastUpdate = now - (state.lastUpdateTime || 0);
      
      // Prevent rapid successive updates (debounce)
      if (timeSinceLastUpdate < updateThreshold) {
        // For critical operations like modal closing, we don't want to skip the update
        if (actionType !== 'closeModal') {
          console.log(`[EntityStore:${storeId}] Skipping rapid update for ${actionType}`);
          return;
        }
      }
      
      // Get all updates at once to batch them
      const updates = fn(state);
      
      // Skip update if no changes were made
      if (Object.keys(updates).length === 0) {
        console.log(`[EntityStore:${storeId}] No changes in ${actionType}, skipping update`);
        return;
      }
      
      if (enableLogging) {
        console.log(`[EntityStore:${storeId}] ${actionType}:`, updates);
      }

      // Batch update with a timestamp to track update frequency
      set({ ...updates, lastUpdateTime: now }, false, actionType);
    };

    return {
      ...initialState,

      // Form actions
      openModal: (mode: FormMode, item: TData | null = null) => {
        safeUpdate(() => ({
          isModalOpen: true,
          formMode: mode,
          selectedItem: item,
          formData: item || {},
          submitError: null
        }), 'openModal');
      },

      closeModal: () => {
        // Get current state to check if already closed
        const state = get();
        if (!state.isModalOpen) return; // Already closed, no need to update
        
        // Batch all state changes in a single update
        safeUpdate(() => ({
          isModalOpen: false,
          submitError: null,
          selectedItem: null,
          formData: {}
        }), 'closeModal');
      },

      setFormMode: (mode: FormMode) => {
        safeUpdate(() => ({ formMode: mode }), 'setFormMode');
      },

      setSelectedItem: (item: TData | null) => {
        safeUpdate(() => ({
          selectedItem: item,
          formData: item || {}
        }), 'setSelectedItem');
      },

      updateFormData: (data: Partial<TData>) => {
        safeUpdate((state) => {
          const currentFormData = state.formData || {};
          const hasChanges = Object.keys(data).some(key => {
            const k = key as keyof TData;
            return !Object.is(currentFormData[k], data[k]);
          });

          if (!hasChanges) return {};

          return {
            formData: { ...currentFormData, ...data }
          };
        }, 'updateFormData');
      },

      resetFormData: (defaultValues?: Partial<TData>) => {
        safeUpdate(() => ({ 
          formData: defaultValues || {} 
        }), 'resetFormData');
      },

      setSubmitting: (isSubmitting: boolean) => {
        safeUpdate(() => ({ isSubmitting }), 'setSubmitting');
      },

      setSubmitError: (error: string | null) => {
        safeUpdate(() => ({ submitError: error }), 'setSubmitError');
      },

      // Table actions
      setItems: (items: TData[]) => {
        safeUpdate(() => ({ items }), 'setItems');
      },

      setTotalItems: (totalItems: number) => {
        safeUpdate(() => ({ totalItems }), 'setTotalItems');
      },

      setTotalPages: (totalPages: number) => {
        safeUpdate(() => ({ totalPages }), 'setTotalPages');
      },

      setCurrentPage: (page: number) => {
        safeUpdate(() => ({ currentPage: page }), 'setCurrentPage');
      },

      setPageSize: (pageSize: number) => {
        safeUpdate(() => ({
          pageSize,
          currentPage: 0
        }), 'setPageSize');
      },

      setLoading: (isLoading: boolean) => {
        safeUpdate(() => ({ isLoading }), 'setLoading');
      },

      setError: (error: Error | null) => {
        safeUpdate(() => ({ error }), 'setError');
      },

      // Selection actions
      setSelectedItems: (items: TData[]) => {
        safeUpdate(() => ({ selectedItems: items }), 'setSelectedItems');
      },

      setSelectedIds: (ids: string[]) => {
        safeUpdate(() => ({ selectedIds: ids }), 'setSelectedIds');
      },

      // Filter/Sort actions
      setSorting: (sorting: SortingState) => {
        safeUpdate(() => ({ sorting }), 'setSorting');
      },

      setFilters: (filters: Partial<TFilter>) => {
        safeUpdate((state) => ({
          filters: { ...state.filters, ...filters },
          currentPage: 0
        }), 'setFilters');
      },

      setColumnFilters: (filters: ColumnFiltersState) => {
        safeUpdate(() => ({
          columnFilters: filters,
          currentPage: 0
        }), 'setColumnFilters');
      },

      setColumnVisibility: (visibility: VisibilityState) => {
        safeUpdate(() => ({ columnVisibility: visibility }), 'setColumnVisibility');
      },

      setGlobalFilter: (filter: string) => {
        safeUpdate(() => ({
          globalFilter: filter,
          currentPage: 0
        }), 'setGlobalFilter');
      },

      setSearchQuery: (query: string) => {
        safeUpdate(() => ({
          searchQuery: query,
          currentPage: 0
        }), 'setSearchQuery');
      },

      setSearchColumn: (column: string) => {
        safeUpdate(() => ({ searchColumn: column }), 'setSearchColumn');
      },

      // Reset actions
      resetFilters: () => {
        safeUpdate(() => ({
          filters: defaultFilters,
          columnFilters: [],
          globalFilter: '',
          searchQuery: '',
          currentPage: 0
        }), 'resetFilters');
      },

      resetPagination: () => {
        safeUpdate(() => ({
          currentPage: 0,
          pageSize: defaultPageSize
        }), 'resetPagination');
      },

      resetTable: () => {
        safeUpdate(() => ({
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: defaultPageSize,
          selectedItems: [],
          selectedIds: [],
          sorting: [],
          columnFilters: [],
          columnVisibility: {},
          globalFilter: '',
          searchQuery: '',
          searchColumn: defaultSearchColumn
        }), 'resetTable');
      },

      reset: () => {
        set(initialState, false, 'reset');
      }
    };
  };

  // Create store with persistence and devtools
  if (shouldPersist) {
    return create<EntityState<TData, TFilter>>()(
      persist(
        devtools(
          createStore,
          { name: `EntityStore-${storeId}` }
        ),
        {
          name: `entity-store-${storeId}`,
          partialize: (state) => ({
            pageSize: state.pageSize,
            columnVisibility: state.columnVisibility,
            filters: state.filters,
            sorting: state.sorting,
          }),
        }
      )
    );
  }

  return create<EntityState<TData, TFilter>>()(
    devtools(
      createStore,
      { name: `EntityStore-${storeId}` }
    )
  );
};

// Export type for better TypeScript support
export type EntityStore<TData = any, TFilter = any> = ReturnType<typeof createEntityStore<TData, TFilter>>;

// Type-safe selector creator
export const createSelector = <TData extends Record<string, any>, TFilter extends Record<string, any>, Selected = unknown>(
  selector: (state: EntityState<TData, TFilter>) => Selected
) => selector;

// Common selectors with proper typing
export const createEntitySelectors = <TData extends Record<string, any>, TFilter extends Record<string, any>>(store: EntityStore<TData, TFilter>) => ({
  useFormState: () => store(
    createSelector((s) => ({
      isModalOpen: s.isModalOpen,
      formMode: s.formMode,
      selectedItem: s.selectedItem,
      formData: s.formData,
      isSubmitting: s.isSubmitting,
      submitError: s.submitError
    }))
  ),

  useTableState: () => store(
    createSelector((s) => ({
      items: s.items,
      totalItems: s.totalItems,
      totalPages: s.totalPages,
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      isLoading: s.isLoading,
      error: s.error
    }))
  ),

  useFilterState: () => store(
    createSelector((s) => ({
      filters: s.filters,
      columnFilters: s.columnFilters,
      globalFilter: s.globalFilter,
      searchQuery: s.searchQuery,
      searchColumn: s.searchColumn,
      sorting: s.sorting
    }))
  )
});
