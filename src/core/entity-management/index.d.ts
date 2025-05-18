declare module '@/features/core/entity-management' {
  import { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
  
  // Base entity interface
  export interface BaseEntity {
    id: string | number;
    [key: string]: any;
  }
  
  // EntityStore interface
  export interface EntityStore<TData = any, TFilter = any> {
    getState: () => EntityState<TData, TFilter>;
    setState: (state: Partial<EntityState<TData, TFilter>>) => void;
    subscribe: (callback: (state: EntityState<TData, TFilter>) => void) => () => void;
    
    // Actions
    setSelectedItems: (items: TData[]) => void;
    setSorting: (sorting: SortingState) => void;
    setColumnFilters: (filters: ColumnFiltersState) => void;
    setColumnVisibility: (visibility: VisibilityState) => void;
    setLoading: (isLoading: boolean) => void;
  }
  
  // EntityState interface
  export interface EntityState<TData = any, TFilter = any> {
    // Form state
    isModalOpen: boolean;
    formMode: FormMode;
    selectedItem: TData | null;
    formData: Partial<TData>;
    isSubmitting: boolean;
    submitError: string | null;
    
    // Table state
    items: TData[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    isLoading: boolean;
    error: Error | null;
    
    // Selection state
    selectedItems: TData[];
    selectedIds: string[];
    
    // Sorting state
    sorting: SortingState;
    
    // Filtering state
    filters: TFilter;
    columnFilters: ColumnFiltersState;
    columnVisibility: VisibilityState;
    globalFilter: string;
    
    // Search state
    searchQuery: string;
    searchColumn: string;
  }
  
  // Form mode type
  export type FormMode = 'view' | 'create' | 'edit';
  
  // Section config type for forms
  export interface SectionConfig {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    fields: FieldConfig[];
  }
  
  // Field config type for forms
  export interface FieldConfig {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
    options?: any;
    icon?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  // Entity Manager creation function
  export function createEntityStore<TData = any, TFilter = any>(
    storeId?: string,
    options?: {
      defaultPageSize?: number;
      defaultSearchColumn?: string;
      defaultFilters?: TFilter;
      persist?: boolean;
      enableLogging?: boolean;
    }
  ): EntityStore<TData, TFilter>;
}
