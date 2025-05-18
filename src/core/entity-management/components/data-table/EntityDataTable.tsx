import React, { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  SortingState,
  VisibilityState,
  Row,
  Header
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TableContextProvider } from './context/TableContext';
import { useTableState } from './hooks/useTableState';
import {
  TableHeader,
  TableControls,
  TableContent,
  TablePagination,
} from './components';
import { BulkActions, RowActions } from './components/TableUtils';
import { EntityTableStore } from './store';
import { createStoreAdapter } from './adapters';
import { 
  FilterableColumn, 
  SearchableColumn, 
  Action, 
  BulkAction 
} from '../../types/data-table';

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
  filterableColumns?: string[] | FilterableColumn[];
  searchableColumns?: string[] | SearchableColumn[];
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
  onFilterChange?: (filters: ColumnFiltersState) => void;
  onSearchChange?: (columnId: string, value: string) => void;
  
  // Zustand state management (optional)
  store?: EntityTableStore<TData>;
}

export function EntityDataTable<TData, TValue>({
  columns,
  data,
  actions = [],
  onExport,
  onAdd,
  addPermission,
  filterableColumns = [],
  searchableColumns = [],
  enableMultiSelect = false,
  onSelectionChange,
  defaultPageSize = 10,
  bulkActions = [],
  enableRowClick = false,
  onRowClick,
  title,
  description,
  isLoading = false,
  // Server-side props
  totalItems,
  pageCount,
  currentPage = 0,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onFilterChange,
  onSearchChange,
  // Zustand store (optional)
  store
}: EntityDataTableProps<TData, TValue>) {
  // Determine if we're using server-side or client-side pagination
  const isServerSide = !!onPageChange;
  
  // Determine if we're using the store or internal state
  const isUsingStore = !!store;
  
  // Use the custom hook for table state management 
  const tableState = useTableState({
    data,
    columns: getColumnsWithExtensions(),
    defaultPageSize,
    currentPage,
    isServerSide,
    pageCount,
    enableMultiSelect,
    searchableColumns,
    filterableColumns,
    onSelectionChange,
    onPageChange,
    onPageSizeChange,
    onSortingChange,
    onFilterChange,
    onSearchChange
  });

  // Use the store adapter if it's an EntityStore but doesn't fully implement EntityTableStore
  const adaptedStore = useMemo(() => {
    if (isUsingStore && store) {
      // Check if store has all required methods for EntityTableStore
      if (!store.setSelectedItems || 
          !store.setSorting || 
          !store.setColumnFilters || 
          !store.setColumnVisibility) {
        console.log('Creating store adapter for EntityDataTable');
        // Use adapter if missing methods
        return createStoreAdapter(store as any);
      }
    }
    return store;
  }, [isUsingStore, store]);

  // When using the Zustand store, sync changes between store and local state
  useEffect(() => {
    if (isUsingStore && adaptedStore) {
      // Set initial table state from store but only if values are different
      // to prevent infinite re-render loops
      const isSortingDifferent = JSON.stringify(tableState.sorting) !== JSON.stringify(adaptedStore.sorting);
      const isColumnFiltersDifferent = JSON.stringify(tableState.columnFilters) !== JSON.stringify(adaptedStore.columnFilters);
      const isVisibilityDifferent = JSON.stringify(tableState.columnVisibility) !== JSON.stringify(adaptedStore.columnVisibility);
      
      if (isSortingDifferent && adaptedStore.sorting) {
        tableState.setSorting(adaptedStore.sorting);
      }
      
      if (isColumnFiltersDifferent && adaptedStore.columnFilters) {
        tableState.setColumnFilters(adaptedStore.columnFilters);
      }
      
      if (isVisibilityDifferent && adaptedStore.columnVisibility) {
        tableState.setColumnVisibility(adaptedStore.columnVisibility);
      }
      
      // When row selection changes, update the store
      const selectedRows = Object.keys(tableState.rowSelection).map(
        index => data[parseInt(index)]
      );
      
      // Only update selected items if they've changed
      const currentSelectedIds = adaptedStore.selectedIds || [];
      const newSelectedIds = Object.keys(tableState.rowSelection);
      
      if (JSON.stringify(currentSelectedIds) !== JSON.stringify(newSelectedIds)) {
        adaptedStore.setSelectedItems(selectedRows);
      }
    }
  }, [isUsingStore, adaptedStore, data, tableState]);
  
  // Handle row click
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => {
    // Don't trigger row click when clicking on actions or selection
    const target = e.target as HTMLElement;
    const isActionClick = target.closest('[data-action-cell="true"]');
    const isSelectionClick = target.closest('[data-selection-cell="true"]');
    
    if (onRowClick && !isActionClick && !isSelectionClick) {
      if (typeof enableRowClick === 'function') {
        if (enableRowClick(e)) {
          onRowClick(row.original);
        }
      } else if (enableRowClick) {
        onRowClick(row.original);
      }
    }
  };

  // Filter out bulk actions for non-existent columns
  const validatedBulkActions = useMemo(() => {
    if (!bulkActions || !bulkActions.length) return [];
    
    return bulkActions.filter(action => {
      if (!action.column) return true; // Keep actions without column specification
      
      // Check if column exists in the actual columns
      const columnExists = columns.some(c => 
        (typeof c.accessorKey === 'string' && c.accessorKey === action.column) || 
        (c.id === action.column)
      );
      
      if (!columnExists) {
        console.warn(`BulkAction for column "${action.column}" does not exist in columns and will be ignored.`);
      }
      
      return columnExists;
    });
  }, [bulkActions, columns]);

  // Render custom header with bulk actions
  const renderHeaderCell = (header: Header<TData, unknown>) => {
    if (!validatedBulkActions || validatedBulkActions.length === 0) {
      return header.isPlaceholder ? null : 
        flexRender(header.column.columnDef.header, header.getContext());
    }
    
    const isBulkActionColumn = validatedBulkActions.some(action => action.column === header.column.id);
    const hasSelectedRows = Object.keys(tableState.rowSelection).length > 0;

    if (isBulkActionColumn && hasSelectedRows) {
      const bulkAction = validatedBulkActions.find(action => action.column === header.column.id);
      const selectedCount = Object.keys(tableState.rowSelection).length;

      return bulkAction ? (
        <BulkActions
          bulkAction={bulkAction}
          column={header.column.id}
          selectedCount={selectedCount}
        />
      ) : null;
    }

    return header.isPlaceholder ? null :
      flexRender(header.column.columnDef.header, header.getContext());
  };
  
  // Create selection column if multiSelect is enabled
  function getColumnsWithExtensions() {
    const selectionColumn = enableMultiSelect ? [{
      id: "select",
      header: ({table}) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({row}) => (
        <div data-selection-cell="true">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }] : [];

    // Create actions column if actions are provided
    const actionsColumn = actions.length > 0 ? [{
      id: "actions",
      header: "Actions",
      cell: ({row}) => <RowActions row={row} />,
      enableSorting: false,
      enableHiding: false,
    }] : [];

    // Combine all columns
    return [
      ...selectionColumn,
      ...columns,
      ...actionsColumn,
    ] as ColumnDef<TData, TValue>[];
  }

  // Use store values if available
  const currentLoading = isUsingStore && adaptedStore?.isLoading !== undefined ? adaptedStore.isLoading : isLoading;

  // Create context value from state and props
  const contextValue = {
    ...tableState,
    data,
    columns,
    // Use the validated columns from tableState
    filterableColumns: tableState.validatedFilterableColumns || [],
    searchableColumns: tableState.validatedSearchableColumns || [],
    actions,
    bulkActions: validatedBulkActions,
    isLoading: currentLoading,
    isServerSide,
    enableMultiSelect,
    enableRowClick,
    onRowClick,
    onSelectionChange,
    onAdd,
    onExport,
    defaultPageSize,
    totalItems,
    pageCount,
    currentPage,
    onPageChange,
    onPageSizeChange,
    onSortingChange,
    onFilterChange,
    onSearchChange,
    title,
    description,
    addPermission,
    handleRowClick,
    renderHeaderCell,
    store: adaptedStore // Make store available to context consumers
  };

  // Ensure TooltipProvider is at the top level
  return (
    <TooltipProvider>
      <TableContextProvider value={contextValue}>
        <div className="flex flex-col min-h-[600px] w-full">
          <Card className="flex-1 w-full overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 transition-all">
            <TableHeader />
            
            <div className="p-5 space-y-5 overflow-hidden">
              <TableControls />
              <TableContent />
            </div>

            <TablePagination />
          </Card>
        </div>
      </TableContextProvider>
    </TooltipProvider>
  );
}
