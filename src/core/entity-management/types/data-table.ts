import { ColumnDef } from "@tanstack/react-table";
import { EntityTableStore } from "../components/data-table/store";

import type { JSX } from "react";

/**
 * Props for the EntityDataTable component - extends the TanStack Table functionality
 */
export interface EntityDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  actions?: Action<TData>[];
  onExport?: () => void;
  onAdd?: () => void;
  addPermission?: { feature: string; action: string };
  filterableColumns?: FilterableColumn[];
  searchableColumns?: SearchableColumn[];
  enableMultiSelect?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  defaultPageSize?: number;
  bulkActions?: BulkAction<TData>[];
  enableRowClick?: boolean | ((event: React.MouseEvent<HTMLTableRowElement>) => boolean);
  onRowClick?: (row: TData) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  
  // Server-side features
  totalItems?: number;
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void;
  onFilterChange?: (columnId: string, value: string) => void;
  onSearchChange?: (columnId: string, value: string) => void;
  
  // Zustand state management (optional)
  store?: EntityTableStore<TData>;
}

/**
 * Action configuration for table rows
 */
export interface Action<TData = any> {
  label: string;
  icon: JSX.Element;
  onClick: (row: TData) => void;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
  className?: string;
  tooltip?: string;
  showConfirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmActionLabel?: string;
  showWhen?: (row: TData) => boolean;
  disabled?: boolean | ((row: TData) => boolean);
  permission?: {
    feature: string;
    action: string;
  };
}

/**
 * Column that can be filtered
 */
export interface FilterableColumn {
  id: string;
  title: string;
  options: {
    label: string;
    value: string;
  }[];
}

/**
 * Column that can be searched
 */
export interface SearchableColumn {
  id: string;
  title: string;
}

/**
 * Bulk action configuration
 */
export interface BulkAction<TData> {
  column: string;
  options: { label: string; value: string }[];
  onUpdate: (selectedRows: TData[], value: string) => Promise<void>;
}

/**
 * Sort information
 */
export interface SortInfo {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter information
 */
export interface FilterInfo {
  [columnId: string]: string | number | boolean | null;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * DataTable state for managing all table state
 */
export interface DataTableState {
  pagination: PaginationInfo;
  sorting: SortInfo;
  filters: FilterInfo;
  search: { [columnId: string]: string };
  selection: Record<string, boolean>;
}
