import { create, StateCreator, StoreApi } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';
import { FormMode } from '@/features/core/tanstack-query-api';
import { createActions } from './actions';

import {
  EntityState,
  EntityBaseState,
  EntityStoreConfig,
  PersistedState
} from './core/types';
import {
  validateStoreConfig,
  validateFormState,
  validateTableState,
  validateFilterState,
  validateSelectionState
} from './core/validation';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_COLUMN,
  DEFAULT_UPDATE_THRESHOLD,
  DEFAULT_STORE_ID,
  PERSISTED_FIELDS
} from './core/constants';

/**
 * Creates a type-safe entity store with optimized updates and memoization
 */
const createEntityStore = <
  TData extends Record<string, any>,
  TFilter extends Record<string, any>
>(config: Partial<EntityStoreConfig<TFilter>> = {}) => {
  // Set defaults and cast types
  const storeConfig = {
    storeId: config.storeId ?? DEFAULT_STORE_ID,
    defaultPageSize: config.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    defaultSearchColumn: config.defaultSearchColumn ?? DEFAULT_SEARCH_COLUMN,
    defaultFilters: config.defaultFilters as TFilter ?? {} as TFilter,
    persist: config.persist ?? false,
    enableLogging: config.enableLogging ?? false,
    updateThreshold: config.updateThreshold ?? DEFAULT_UPDATE_THRESHOLD
  } as const;

  // Validate configuration
  const validatedConfig = validateStoreConfig(storeConfig);

  // Create initial state
  const initialState: EntityBaseState<TData, TFilter> = {
    // Form state
    isModalOpen: false,
    formMode: 'view' as FormMode,
    selectedItem: null,
    formData: {} as Partial<TData>,
    isSubmitting: false,
    submitError: null,

    // Table state
    items: [] as TData[],
    totalItems: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: storeConfig.defaultPageSize,
    isLoading: false,
    error: null,

    // Selection state
    selectedItems: [] as TData[],
    selectedIds: [] as string[],

    // Filter state
    filters: storeConfig.defaultFilters,
    columnFilters: [],
    columnVisibility: {},
    globalFilter: '',
    searchQuery: '',
    searchColumn: storeConfig.defaultSearchColumn,
    sorting: [],

    // Update tracking
    lastUpdateTime: Date.now()
  };

  const createBaseStore: StateCreator<
    EntityState<TData, TFilter>,
    [],
    [],
    EntityState<TData, TFilter>
  > = (set, get) => {
    // Create store API for actions
    const storeApi: StoreApi<EntityState<TData, TFilter>> = {
      setState: set,
      getState: get,
      subscribe: (listener) => {
        // Subscribe handled by Zustand
        return () => {};
      },
      getInitialState: () => initialState as EntityState<TData, TFilter>,
    };

    // Create store actions
    const storeActions = createActions(storeApi, storeConfig);

    // Return combined state and actions
    return {
      ...initialState,
      ...storeActions,
    };
  };

  // Add middleware
  if (storeConfig.persist) {
    type StoreType = EntityState<TData, TFilter>;
    type Persisted = PersistedState<TFilter>;

    const persistConfig: PersistOptions<EntityState<TData, TFilter>, PersistedState<TFilter>> = {
      name: `entity-store-${storeConfig.storeId}`,
      partialize: (state) => ({
        pageSize: state.pageSize,
        columnVisibility: state.columnVisibility,
        filters: state.filters,
        sorting: state.sorting
      } as PersistedState<TFilter>)
    };

    return create<StoreType>()(
      devtools(
        persist(createBaseStore, persistConfig)
      )
    );
  }

  return create<EntityState<TData, TFilter>>()(
    devtools(createBaseStore)
  );
};

export default createEntityStore;