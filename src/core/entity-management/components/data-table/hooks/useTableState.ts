import { useState, useEffect, useMemo } from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Row,
  Header,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnDef
} from '@tanstack/react-table';
import { FilterableColumn, SearchableColumn } from '../../../types/data-table';

interface UseTableStateProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  defaultPageSize?: number;
  currentPage?: number;
  isServerSide?: boolean;
  pageCount?: number;
  enableMultiSelect?: boolean;
  searchableColumns?: SearchableColumn[];
  filterableColumns?: FilterableColumn[];
  onSelectionChange?: (selectedRows: TData[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void;
  onFilterChange?: (columnId: string, value: string) => void;
  onSearchChange?: (columnId: string, value: string) => void;
}

export const useTableState = <TData, TValue>({
  data,
  columns,
  defaultPageSize = 10,
  currentPage = 0,
  isServerSide = false,
  pageCount,
  enableMultiSelect = false,
  searchableColumns = [],
  filterableColumns = [],
  onSelectionChange,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onFilterChange,
  onSearchChange
}: UseTableStateProps<TData, TValue>) => {
  // Filter out invalid columns to prevent errors
  const validatedFilterableColumns = useMemo(() => {
    return filterableColumns.filter(col => {
      // Check if column exists in the actual columns
      const columnExists = columns.some(c => 
        (typeof c.accessorKey === 'string' && c.accessorKey === col.id) || 
        (c.id === col.id)
      );
      
      if (!columnExists) {
        console.warn(`FilterableColumn with id "${col.id}" does not exist in columns and will be ignored.`);
      }
      
      return columnExists;
    });
  }, [columns, filterableColumns]);
  
  const validatedSearchableColumns = useMemo(() => {
    return searchableColumns.filter(col => {
      // Check if column exists in the actual columns
      const columnExists = columns.some(c => 
        (typeof c.accessorKey === 'string' && c.accessorKey === col.id) || 
        (c.id === col.id)
      );
      
      if (!columnExists) {
        console.warn(`SearchableColumn with id "${col.id}" does not exist in columns and will be ignored.`);
      }
      
      return columnExists;
    });
  }, [columns, searchableColumns]);

  // Local state (used for client-side operations)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchColumn, setSearchColumn] = useState<string>(
    validatedSearchableColumns.length > 0 ? validatedSearchableColumns[0].id : ''
  );
  // Track active search to avoid double-counting in filter indicators
  const [activeSearch, setActiveSearch] = useState<{column: string, query: string} | null>(null);

  // Active filter indicator
  const activeFiltersCount = useMemo(() => {
    // Exclude the current search filter from the count if it exists
    if (activeSearch && activeSearch.query) {
      const nonSearchFilters = columnFilters.filter(filter => 
        !(filter.id === activeSearch.column && filter.value === activeSearch.query)
      );
      return nonSearchFilters.length;
    }
    return columnFilters.length;
  }, [columnFilters, activeSearch]);

  // Handle sorting changes
  const handleSortingChange = (updatedSorting: SortingState) => {
    if (isServerSide && onSortingChange && updatedSorting.length > 0) {
      const { id, desc } = updatedSorting[0];
      onSortingChange(id, desc ? 'desc' : 'asc');
    }
    setSorting(updatedSorting);
  };

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: any) => {
    // First, verify the column exists
    const columnExists = columns.some(c => 
      (typeof c.accessorKey === 'string' && c.accessorKey === columnId) || 
      (c.id === columnId)
    );
    
    if (!columnExists) {
      console.warn(`Attempted to filter on non-existent column "${columnId}"`);
      return;
    }
    
    if (isServerSide && onFilterChange) {
      onFilterChange(columnId, value === "__all__" ? "" : value);
    } else {
      setColumnFilters(prev => {
        const existing = prev.findIndex(filter => filter.id === columnId);
        if (existing !== -1) {
          return value && value !== "__all__"
            ? prev.map(filter => filter.id === columnId ? { id: columnId, value } : filter)
            : prev.filter(filter => filter.id !== columnId);
        } else if (value && value !== "__all__") {
          return [...prev, { id: columnId, value }];
        }
        return prev;
      });
    }
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery && searchColumn) {
      // First, verify the column exists
      const columnExists = columns.some(c => 
        (typeof c.accessorKey === 'string' && c.accessorKey === searchColumn) || 
        (c.id === searchColumn)
      );
      
      if (!columnExists) {
        console.warn(`Attempted to search on non-existent column "${searchColumn}"`);
        return;
      }
      
      // Track the active search to avoid counting it in filters
      setActiveSearch({ column: searchColumn, query: searchQuery });
      
      if (isServerSide && onSearchChange) {
        onSearchChange(searchColumn, searchQuery);
      } else {
        // First remove any existing filter for this column from search
        setColumnFilters(prev => prev.filter(filter => filter.id !== searchColumn));
        // Then add the new search filter
        if (searchQuery.trim() !== '') {
          setColumnFilters(prev => [...prev, { id: searchColumn, value: searchQuery }]);
        }
      }
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
    if (searchColumn && activeSearch) {
      setActiveSearch(null);
      
      if (isServerSide && onSearchChange) {
        onSearchChange(searchColumn, '');
      } else {
        // Remove the search filter
        setColumnFilters(prev => prev.filter(filter => filter.id !== searchColumn));
      }
    }
  };

  // Reset search column when searchableColumns change
  useEffect(() => {
    if (validatedSearchableColumns.length > 0) {
      const initialSearchColumn = validatedSearchableColumns[0].id;
      if (searchColumn !== initialSearchColumn && !validatedSearchableColumns.some(col => col.id === searchColumn)) {
        setSearchColumn(initialSearchColumn);
      }
    } else {
      setSearchColumn('');
    }
  }, [validatedSearchableColumns, searchColumn]);

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage,
        pageSize: defaultPageSize,
      },
    },
    pageCount: isServerSide ? pageCount : undefined,
    enableRowSelection: enableMultiSelect,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({
          pageIndex: currentPage,
          pageSize: defaultPageSize,
        });
        
        if (isServerSide) {
          if (onPageChange && newPagination.pageIndex !== currentPage) {
            onPageChange(newPagination.pageIndex);
          }
          if (onPageSizeChange && newPagination.pageSize !== defaultPageSize) {
            onPageSizeChange(newPagination.pageSize);
          }
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
  });

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onSelectionChange]);

  return {
    // Table instance
    table,
    
    // State
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    searchQuery,
    setSearchQuery,
    searchColumn, 
    setSearchColumn,
    activeSearch,
    
    // UI indicators
    activeFiltersCount,
    
    // Handlers
    handleSortingChange,
    handleFilterChange,
    handleSearch,
    resetSearch,
    
    // Validated columns
    validatedFilterableColumns,
    validatedSearchableColumns,
  };
};
