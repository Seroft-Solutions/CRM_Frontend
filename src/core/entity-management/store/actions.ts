import { StoreApi } from 'zustand';
import { EntityState, EntityBaseState } from './types';
import { FormMode } from '@/features/core/tanstack-query-api';
import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

type StoreType<TData, TFilter> = StoreApi<EntityState<TData, TFilter>>;
type StateUpdates<TData, TFilter> = Partial<EntityBaseState<TData, TFilter>>;

interface StoreConfig<TFilter> {
  updateThreshold: number;
  defaultPageSize: number;
  defaultSearchColumn: string;
  defaultFilters: TFilter;
  enableLogging?: boolean;
  storeId: string;
}

export const createActions = <TData extends Record<string, any>, TFilter extends Record<string, any>>(
  store: StoreType<TData, TFilter>,
  config: StoreConfig<TFilter>
) => {
  const {
    updateThreshold,
    defaultPageSize,
    defaultSearchColumn,
    defaultFilters,
    enableLogging,
    storeId
  } = config;

  // Safe update helper with type checking
  const safeUpdate = (updates: StateUpdates<TData, TFilter>, actionType: string) => {
    const state = store.getState();
    const now = Date.now();
    const timeSinceLastUpdate = now - state.lastUpdateTime;
    
    if (timeSinceLastUpdate < updateThreshold) {
      return;
    }

    if (enableLogging) {
      console.log(`[EntityStore:${storeId}] ${actionType}:`, updates);
    }

    store.setState(state => ({
      ...state,
      ...updates,
      lastUpdateTime: now
    }));
  };

  // Form actions
  const formActions = {
    openModal: (mode: FormMode, item: TData | null = null) => {
      safeUpdate({
        isModalOpen: true,
        formMode: mode,
        selectedItem: item,
        formData: item || {},
        submitError: null
      }, 'openModal');
    },

    closeModal: () => {
      safeUpdate({
        isModalOpen: false,
        submitError: null,
        selectedItem: null,
        formData: {}
      }, 'closeModal');
    },

    setFormMode: (mode: FormMode) => {
      safeUpdate({ formMode: mode }, 'setFormMode');
    },

    setSelectedItem: (item: TData | null) => {
      safeUpdate({
        selectedItem: item,
        formData: item || {}
      }, 'setSelectedItem');
    },

    updateFormData: (data: Partial<TData>) => {
      const state = store.getState();
      const currentFormData = state.formData || {};
      const hasChanges = Object.keys(data).some(key => {
        const k = key as keyof TData;
        return !Object.is(currentFormData[k], data[k]);
      });

      if (!hasChanges) return;

      safeUpdate({
        formData: { ...currentFormData, ...data }
      }, 'updateFormData');
    },

    resetFormData: (defaultValues?: Partial<TData>) => {
      safeUpdate({ 
        formData: defaultValues || {} 
      }, 'resetFormData');
    },

    setSubmitting: (isSubmitting: boolean) => {
      safeUpdate({ isSubmitting }, 'setSubmitting');
    },

    setSubmitError: (error: string | null) => {
      safeUpdate({ submitError: error }, 'setSubmitError');
    }
  };

  // Table actions
  const tableActions = {
    setItems: (items: TData[]) => {
      safeUpdate({ items }, 'setItems');
    },

    setTotalItems: (totalItems: number) => {
      safeUpdate({ totalItems }, 'setTotalItems');
    },

    setTotalPages: (totalPages: number) => {
      safeUpdate({ totalPages }, 'setTotalPages');
    },

    setCurrentPage: (page: number) => {
      safeUpdate({ currentPage: page }, 'setCurrentPage');
    },

    setPageSize: (pageSize: number) => {
      safeUpdate({
        pageSize,
        currentPage: 0
      }, 'setPageSize');
    },

    setLoading: (isLoading: boolean) => {
      safeUpdate({ isLoading }, 'setLoading');
    },

    setError: (error: Error | null) => {
      safeUpdate({ error }, 'setError');
    }
  };

  // Selection actions
  const selectionActions = {
    setSelectedItems: (items: TData[]) => {
      safeUpdate({ selectedItems: items }, 'setSelectedItems');
    },

    setSelectedIds: (ids: string[]) => {
      safeUpdate({ selectedIds: ids }, 'setSelectedIds');
    }
  };

  // Filter/Sort actions
  const filterActions = {
    setSorting: (sorting: SortingState) => {
      safeUpdate({ sorting }, 'setSorting');
    },

    setFilters: (filters: Partial<TFilter>) => {
      const state = store.getState();
      safeUpdate({
        filters: { ...state.filters, ...filters },
        currentPage: 0
      }, 'setFilters');
    },

    setColumnFilters: (filters: ColumnFiltersState) => {
      safeUpdate({
        columnFilters: filters,
        currentPage: 0
      }, 'setColumnFilters');
    },

    setColumnVisibility: (visibility: VisibilityState) => {
      safeUpdate({ columnVisibility: visibility }, 'setColumnVisibility');
    },

    setGlobalFilter: (filter: string) => {
      safeUpdate({
        globalFilter: filter,
        currentPage: 0
      }, 'setGlobalFilter');
    },

    setSearchQuery: (query: string) => {
      safeUpdate({
        searchQuery: query,
        currentPage: 0
      }, 'setSearchQuery');
    },

    setSearchColumn: (column: string) => {
      safeUpdate({ searchColumn: column }, 'setSearchColumn');
    }
  };

  // Reset actions
  const resetActions = {
    resetFilters: () => {
      safeUpdate({
        filters: defaultFilters,
        columnFilters: [],
        globalFilter: '',
        searchQuery: '',
        currentPage: 0
      }, 'resetFilters');
    },

    resetPagination: () => {
      safeUpdate({
        currentPage: 0,
        pageSize: defaultPageSize
      }, 'resetPagination');
    },

    resetTable: () => {
      safeUpdate({
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
      }, 'resetTable');
    }
  };

  return {
    ...formActions,
    ...tableActions,
    ...selectionActions,
    ...filterActions,
    ...resetActions,
    reset: () => {
      store.setState({
        isModalOpen: false,
        formMode: 'view' as FormMode,
        selectedItem: null,
        formData: {},
        isSubmitting: false,
        submitError: null,
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: defaultPageSize,
        isLoading: false,
        error: null,
        selectedItems: [],
        selectedIds: [],
        filters: defaultFilters,
        columnFilters: [],
        columnVisibility: {},
        globalFilter: '',
        searchQuery: '',
        searchColumn: defaultSearchColumn,
        sorting: [],
        lastUpdateTime: Date.now()
      });
    }
  };
};