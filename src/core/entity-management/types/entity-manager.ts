import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { EntityDataTableProps } from './data-table';
import { EntityFormProps, FieldConfig, SectionConfig, DisplayMode } from './entity-form';
import { EntityApiEndpoints, BaseEntity, FormMode } from '@/features/core/tanstack-query-api';

/**
 * Permission configuration for entity operations
 */
export interface EntityPermissions {
  feature: string;
  view?: string;
  create?: string;
  update?: string;
  delete?: string;
}

/**
 * Configuration for entity labels and messages
 */
export interface EntityLabels {
  entityName: string;
  entityNamePlural: string;
  createTitle?: string;
  editTitle?: string;
  viewTitle?: string;
  createDescription?: string;
  editDescription?: string;
  viewDescription?: string;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
  noDataMessage?: string;
  loadingMessage?: string;
}

/**
 * Props for the EntityManager component
 */
export interface EntityManagerProps<TData extends BaseEntity = any, TFilter = any> {
  // Core configuration
  endpoints: EntityApiEndpoints;
  permissions?: EntityPermissions;
  labels: EntityLabels;
  
  // Table configuration
  columns: ColumnDef<TData, any>[];
  tableProps?: Partial<EntityDataTableProps<TData, any>>;
  filterableColumns?: EntityDataTableProps<TData, any>['filterableColumns'];
  searchableColumns?: EntityDataTableProps<TData, any>['searchableColumns'];
  
  // Form configuration
  formFields?: FieldConfig[];
  formSections?: SectionConfig[];
  defaultValues?: Partial<TData>;
  transformFormData?: (data: any, mode: FormMode) => any;
  validateFormData?: (data: any, mode: FormMode) => any;
  formProps?: Partial<EntityFormProps<TData>>;
  validationSchema?: any;
  
  // Customization
  renderFilters?: (props: {
    filters: TFilter;
    setFilters: (filters: TFilter) => void;
    resetFilters: () => void;
  }) => ReactNode;
  
  // Events
  onCreated?: (data: TData) => void;
  onUpdated?: (data: TData) => void;
  onDeleted?: (id: string | number) => void;
  onFilterChange?: (filters: TFilter) => void;
  
  // Additional features
  enableExport?: boolean;
  exportData?: (data: TData[]) => void;
  enableRowSelection?: boolean;
  bulkActions?: EntityDataTableProps<TData, any>['bulkActions'];
  enableInlineEdit?: boolean;
  
  // UI behavior
  showDeleteInViewMode?: boolean; // Whether to show delete button in view mode, defaults to false
  formDisplayMode?: DisplayMode; // Display mode for the form, defaults to 'dialog'
  
  // Default pagination
  defaultPageSize?: number;
  defaultFilters?: TFilter;
}

/**
 * Entity operation types
 */
export type EntityOperation = 'view' | 'create' | 'update' | 'delete';

/**
 * Entity manager state interface
 */
export interface EntityManagerState<TData = any, TFilter = any> {
  // Data
  data: TData[];
  selectedItem: TData | null;
  filters: TFilter;
  
  // UI state
  isLoading: boolean;
  isModalOpen: boolean;
  formMode: FormMode;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Actions
  setFilters: (filters: TFilter) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (field: string, order: 'asc' | 'desc') => void;
  selectItem: (item: TData | null) => void;
  openModal: (mode: FormMode, item?: TData | null) => void;
  closeModal: () => void;
  refresh: () => void;
}

// Re-export types from tanstack-query-api for convenience
export type { BaseEntity, FormMode, EntityApiEndpoints };
