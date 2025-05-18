/** Default configuration values */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SEARCH_COLUMN = '';
export const DEFAULT_UPDATE_THRESHOLD = 100; // ms
export const DEFAULT_STORE_ID = 'entity-store';

/** Form modes */
export const FORM_MODES = ['create', 'edit', 'view', 'delete'] as const;

/** Persistence configuration */
export const PERSISTED_FIELDS = [
  'pageSize',
  'columnVisibility',
  'filters',
  'sorting'
] as const;

/** Action type prefixes */
export const ACTION_TYPES = {
  // Form actions
  OPEN_MODAL: 'openModal',
  CLOSE_MODAL: 'closeModal',
  SET_FORM_MODE: 'setFormMode',
  SET_SELECTED_ITEM: 'setSelectedItem',
  UPDATE_FORM_DATA: 'updateFormData',
  RESET_FORM_DATA: 'resetFormData',
  SET_SUBMITTING: 'setSubmitting',
  SET_SUBMIT_ERROR: 'setSubmitError',

  // Table actions
  SET_ITEMS: 'setItems',
  SET_TOTAL_ITEMS: 'setTotalItems', 
  SET_TOTAL_PAGES: 'setTotalPages',
  SET_CURRENT_PAGE: 'setCurrentPage',
  SET_PAGE_SIZE: 'setPageSize',
  SET_LOADING: 'setLoading',
  SET_ERROR: 'setError',

  // Selection actions  
  SET_SELECTED_ITEMS: 'setSelectedItems',
  SET_SELECTED_IDS: 'setSelectedIds',

  // Filter/Sort actions
  SET_SORTING: 'setSorting',
  SET_FILTERS: 'setFilters',
  SET_COLUMN_FILTERS: 'setColumnFilters', 
  SET_COLUMN_VISIBILITY: 'setColumnVisibility',
  SET_GLOBAL_FILTER: 'setGlobalFilter',
  SET_SEARCH_QUERY: 'setSearchQuery',
  SET_SEARCH_COLUMN: 'setSearchColumn',

  // Reset actions
  RESET_FILTERS: 'resetFilters',
  RESET_PAGINATION: 'resetPagination',
  RESET_TABLE: 'resetTable',
  RESET: 'reset'
} as const;

/** State slice names */
export const STATE_SLICES = {
  FORM: 'form',
  TABLE: 'table',
  SELECTION: 'selection',
  FILTER: 'filter'
} as const;