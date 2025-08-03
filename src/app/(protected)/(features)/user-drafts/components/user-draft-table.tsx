// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { userDraftToast, handleUserDraftError } from "./user-draft-toast";
import { useQueryClient } from '@tanstack/react-query';
import { Search, X, Download, Settings2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add custom scrollbar styles
const tableScrollStyles = `
  .table-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .table-container {
    max-width: calc(100vw - 2rem);
  }
  @media (min-width: 1024px) {
    .table-container {
      max-width: calc(100vw - 20rem);
    }
  }
`;

import {
  useGetAllUserDrafts,
  useDeleteUserDraft,
  useCountUserDrafts,
  useUpdateUserDraft,
  usePartialUpdateUserDraft,
  useSearchUserDrafts,
} from "@/core/api/generated/spring/endpoints/user-draft-resource/user-draft-resource.gen";





import { UserDraftSearchAndFilters } from "./table/user-draft-search-filters";
import { UserDraftTableHeader } from "./table/user-draft-table-header";
import { UserDraftTableRow } from "./table/user-draft-table-row";
import { BulkRelationshipAssignment } from "./table/bulk-relationship-assignment";
import { AdvancedPagination, usePaginationState } from "./table/advanced-pagination";

// Define sort ordering constants
const ASC = "asc";
const DESC = "desc";

// Define column configuration
interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

// Define all available columns
const ALL_COLUMNS: ColumnConfig[] = [
  {
    id: 'id',
    label: 'ID',
    accessor: 'id',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  
  {
    id: 'keycloakUserId',
    label: 'Keycloak User Id',
    accessor: 'keycloakUserId',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'type',
    label: 'Type',
    accessor: 'type',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'jsonPayload',
    label: 'Json Payload',
    accessor: 'jsonPayload',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  
  
  {
    id: 'createdBy',
    label: 'Created By',
    accessor: 'createdBy',
    type: 'field',
    visible: false, // Hidden by default
    sortable: true,
  },
  
  {
    id: 'createdDate',
    label: 'Created Date',
    accessor: 'createdDate',
    type: 'field',
    visible: false, // Hidden by default
    sortable: true,
  },
  
  {
    id: 'lastModifiedBy',
    label: 'Last Modified By',
    accessor: 'lastModifiedBy',
    type: 'field',
    visible: false, // Hidden by default
    sortable: true,
  },
  
  {
    id: 'lastModifiedDate',
    label: 'Last Modified Date',
    accessor: 'lastModifiedDate',
    type: 'field',
    visible: false, // Hidden by default
    sortable: true,
  },
  
];

// Local storage key for column visibility with version
const COLUMN_VISIBILITY_KEY = 'user-draft-table-columns'; // v2 to force reset for auditing fields

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function UserDraftTable() {
  const queryClient = useQueryClient();
  
  // Enhanced pagination state management
  const {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
  } = usePaginationState(1, 10); // Default to 25 items per page
  
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState(ASC);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkRelationshipDialog, setShowBulkRelationshipDialog] = useState(false);
  
  // Track individual cell updates instead of global state
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());
  
  // Track whether column visibility has been loaded from localStorage
  const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);
  
  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Load column visibility from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      const oldKey = 'user-draft-table-columns'; // Old key without version
      
      if (saved) {
        setColumnVisibility(JSON.parse(saved));
      } else {
        // Check for old localStorage data and migrate/reset
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          // Remove old key to force reset for auditing fields
          localStorage.removeItem(oldKey);
        }
        
        // Set default visibility with auditing fields hidden
        const defaultVisibility = ALL_COLUMNS.reduce((acc, col) => ({ 
          ...acc, 
          [col.id]: col.visible 
        }), {});
        setColumnVisibility(defaultVisibility);
      }
    } catch (error) {
      console.warn('Failed to load column visibility from localStorage:', error);
      // Fallback to default visibility
      const defaultVisibility = ALL_COLUMNS.reduce((acc, col) => ({ 
        ...acc, 
        [col.id]: col.visible 
      }), {});
      setColumnVisibility(defaultVisibility);
    } finally {
      setIsColumnVisibilityLoaded(true);
    }
  }, []);

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    if (isColumnVisibilityLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
      } catch (error) {
        console.warn('Failed to save column visibility to localStorage:', error);
      }
    }
  }, [columnVisibility, isColumnVisibilityLoaded]);

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter(col => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Manual refresh functionality
  const handleRefresh = async () => {
    try {
      // Invalidate all related queries to force fresh data
      await queryClient.invalidateQueries({ 
        queryKey: ['getAllUserDrafts'],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['countUserDrafts'],
        refetchType: 'active'
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['searchUserDrafts'],
        refetchType: 'active'
      });
      
      
      // Also manually trigger refetch
      await refetch();
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Export functionality
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = visibleColumns.map(col => col.label);
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        return visibleColumns.map(col => {
          let value = '';
          if (col.type === 'field') {
            const fieldValue = item[col.accessor as keyof typeof item];
            value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
          } else if (col.type === 'relationship') {
            const relationship = item[col.accessor as keyof typeof item] as any;
            
          }
          // Escape CSV values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-draft-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  // Calculate API pagination parameters (0-indexed)
  const apiPage = page - 1;

  

  // Helper function to find entity ID by name
  const findEntityIdByName = (entities: any[], name: string, displayField: string = 'name') => {
    const entity = entities?.find(e => e[displayField]?.toLowerCase().includes(name.toLowerCase()));
    return entity?.id;
  };

  // Build filter parameters for API
  const buildFilterParams = () => {
    const params: Record<string, any> = {};
    
    
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        
        
        
        
        // Handle createdDate date filter
        if (key === 'createdDate') {
          if (value instanceof Date) {
            params['createdDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['createdDate.equals'] = value;
          }
        }
        
        // Handle lastModifiedDate date filter
        if (key === 'lastModifiedDate') {
          if (value instanceof Date) {
            params['lastModifiedDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['lastModifiedDate.equals'] = value;
          }
        }
        
        
        // Handle keycloakUserId text filter with contains
        else if (key === 'keycloakUserId') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['keycloakUserId.contains'] = value;
          }
        }
        
        // Handle type text filter with contains
        else if (key === 'type') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['type.contains'] = value;
          }
        }
        
        // Handle jsonPayload text filter with contains
        else if (key === 'jsonPayload') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['jsonPayload.contains'] = value;
          }
        }
        
        // Handle createdBy text filter with contains
        else if (key === 'createdBy') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['createdBy.contains'] = value;
          }
        }
        
        // Handle lastModifiedBy text filter with contains
        else if (key === 'lastModifiedBy') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['lastModifiedBy.contains'] = value;
          }
        }
        
        // Handle other filters
        else if (Array.isArray(value) && value.length > 0) {
          // Handle array values (for multi-select filters)
          params[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Fallback for unknown string fields - use contains
          params[`${key}.contains`] = value;
        }
      }
    });

    // Add date range filters
    
    if (dateRange.from) {
      params['createdDate.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['createdDate.lessThanOrEqual'] = dateRange.to.toISOString();
    }
    
    if (dateRange.from) {
      params['lastModifiedDate.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['lastModifiedDate.lessThanOrEqual'] = dateRange.to.toISOString();
    }
    

    return params;
  };

  const filterParams = buildFilterParams();

  // Fetch data with React Query
  
  const { data, isLoading, refetch } = searchTerm 
    ? useSearchUserDrafts(
        {
          query: searchTerm,
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        },
        {
          query: {
            enabled: true,
            staleTime: 0, // Always consider data stale for immediate refetch
            refetchOnWindowFocus: true,
          },
        }
      )
    : useGetAllUserDrafts(
        {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        },
        {
          query: {
            enabled: true,
            staleTime: 0, // Always consider data stale for immediate refetch
            refetchOnWindowFocus: true,
          },
        }
      );
  

  // Get total count for pagination
  const { data: countData } = useCountUserDrafts(
    filterParams,
    {
      query: {
        enabled: true,
        staleTime: 0, // Always consider data stale for immediate refetch
        refetchOnWindowFocus: true,
      },
    }
  );

  // Full update mutation for relationship editing with optimistic updates
  const { mutate: updateEntity, isPending: isUpdating } = useUpdateUserDraft({
    mutation: {
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ 
          queryKey: ['getAllUserDrafts'] 
        });
        
        await queryClient.cancelQueries({ 
          queryKey: ['searchUserDrafts'] 
        });
        

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }]);

        // Optimistically update the cache
        if (previousData && Array.isArray(previousData)) {
          queryClient.setQueryData(['getAllUserDrafts', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old.map(userDraft => 
              userDraft.id === variables.id 
                ? { ...userDraft, ...variables.data }
                : userDraft
            )
          );
        }

        
        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(['searchUserDrafts', {
            query: searchTerm,
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old?.map(userDraft => 
              userDraft.id === variables.id 
                ? { ...userDraft, ...variables.data }
                : userDraft
            )
          );
        }
        

        return { previousData };
      },
      onSuccess: (data, variables) => {
        // CRITICAL: Update cache with server response to ensure UI reflects actual data
        queryClient.setQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], (old: any[]) => 
          old?.map(userDraft => 
            userDraft.id === variables.id 
              ? data // Use complete server response
              : userDraft
          )
        );

        
        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(['searchUserDrafts', {
            query: searchTerm,
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old?.map(userDraft => 
              userDraft.id === variables.id 
                ? data // Use complete server response
                : userDraft
            )
          );
        }
        

        userDraftToast.updated();
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(['getAllUserDrafts', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], context.previousData);
        }
        handleUserDraftError(error);
      },
      onSettled: () => {
        // Force a background refetch to ensure eventual consistency
        queryClient.invalidateQueries({ 
          queryKey: ['getAllUserDrafts'],
          refetchType: 'none' // Don't refetch immediately, just mark as stale
        });
      },
    },
  });

  // Delete mutation with optimistic updates
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteUserDraft({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['getAllUserDrafts'] });
        
        const previousData = queryClient.getQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }]);

        // Optimistically remove the item
        queryClient.setQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], (old: any[]) => 
          old?.filter(userDraft => userDraft.id !== variables.id)
        );

        return { previousData };
      },
      onSuccess: () => {
        userDraftToast.deleted();
        // Update count cache
        queryClient.setQueryData(['countUserDrafts', filterParams], (old: number) => 
          Math.max(0, (old || 0) - 1)
        );
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(['getAllUserDrafts', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], context.previousData);
        }
        handleUserDraftError(error);
      },
    },
  });

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === ASC ? DESC : ASC);
    } else {
      setSort(column);
      setOrder(ASC);
    }
  };

  // Get sort direction icon
  const getSortIcon = (column: string) => {
    if (sort !== column) {
      return "ChevronsUpDown";
    }
    return order === ASC ? "ChevronUp" : "ChevronDown";
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteEntity({ id: deleteId });
    }
    setShowDeleteDialog(false);
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    resetPagination(); // Reset to page 1 when filters change
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    resetPagination(); // Reset to page 1 when clearing filters
  };

  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination(); // Reset to page 1 when searching
  };
  

  // Calculate total pages
  const totalItems = countData || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle row selection
  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (data && selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else if (data) {
      setSelectedRows(new Set(data.map(item => item.id).filter((id): id is number => id !== undefined)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['getAllUserDrafts'] });
    
    // Get current data for rollback
    const previousData = queryClient.getQueryData(['getAllUserDrafts', {
      page: apiPage,
      size: pageSize,
      sort: [`${sort},${order}`],
      ...filterParams,
    }]);

    try {
      // Optimistically remove all selected items
      queryClient.setQueryData(['getAllUserDrafts', {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      }], (old: any[]) => 
        old?.filter(userDraft => !selectedRows.has(userDraft.id || 0))
      );

      // Process deletions
      const deletePromises = Array.from(selectedRows).map(id => 
        new Promise<void>((resolve, reject) => {
          deleteEntity({ id }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          });
        })
      );

      await Promise.all(deletePromises);
      userDraftToast.bulkDeleted(selectedRows.size);
      setSelectedRows(new Set());
      
      // Update count cache
      queryClient.setQueryData(['countUserDrafts', filterParams], (old: number) => 
        Math.max(0, (old || 0) - selectedRows.size)
      );
      
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], previousData);
      }
      userDraftToast.bulkDeleteError();
    }
    setShowBulkDeleteDialog(false);
  };

  // Enhanced relationship update handler with individual cell tracking
  const handleRelationshipUpdate = async (
    entityId: number, 
    relationshipName: string, 
    newValue: number | null,
    isBulkOperation: boolean = false
  ) => {
    const cellKey = `${entityId}-${relationshipName}`;
    
    // Track this specific cell as updating
    setUpdatingCells(prev => new Set(prev).add(cellKey));
    
    return new Promise<void>((resolve, reject) => {
      // Get the current entity data first
      const currentEntity = data?.find(item => item.id === entityId);
      if (!currentEntity) {
        setUpdatingCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        reject(new Error('UserDraft not found in current data'));
        return;
      }

      // Create complete update data with current values, then update the specific relationship
      const updateData: any = {
        ...currentEntity,
        id: entityId
      };
      
      // Update only the specific relationship
      if (newValue) {
        // Find the full relationship object from options
        const relationshipConfig = relationshipConfigs.find(config => config.name === relationshipName);
        const selectedOption = relationshipConfig?.options.find(opt => opt.id === newValue);
        updateData[relationshipName] = selectedOption || { id: newValue };
      } else {
        updateData[relationshipName] = null;
      }

      updateEntity({ 
        id: entityId,
        data: updateData
      }, {
        onSuccess: (serverResponse) => {
          // CRITICAL: Ensure individual cache updates with server response for bulk operations
          if (isBulkOperation) {
            // Update cache with server response for this specific entity
            queryClient.setQueryData(['getAllUserDrafts', {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            }], (old: any[]) => 
              old?.map(userDraft => 
                userDraft.id === entityId 
                  ? serverResponse // Use server response
                  : userDraft
              )
            );

            
            // Also update search cache if applicable
            if (searchTerm) {
              queryClient.setQueryData(['searchUserDrafts', {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              }], (old: any[]) => 
                old?.map(userDraft => 
                  userDraft.id === entityId 
                    ? serverResponse // Use server response
                    : userDraft
                )
              );
            }
            
          }

          // Only show individual toast if not part of bulk operation
          if (!isBulkOperation) {
            userDraftToast.relationshipUpdated(relationshipName);
          }
          resolve();
        },
        onError: (error: any) => {
          reject(error);
        },
        onSettled: () => {
          // Remove this cell from updating state
          setUpdatingCells(prev => {
            const newSet = new Set(prev);
            newSet.delete(cellKey);
            return newSet;
          });
        }
      });
    });
  };

  // Handle bulk relationship updates with individual server response syncing
  const handleBulkRelationshipUpdate = async (entityIds: number[], relationshipName: string, newValue: number | null) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['getAllUserDrafts'] });
    
    // Get current data for rollback
    const previousData = queryClient.getQueryData(['getAllUserDrafts', {
      page: apiPage,
      size: pageSize,
      sort: [`${sort},${order}`],
      ...filterParams,
    }]);

    try {
      // Process updates sequentially with bulk operation flag
      // Each individual update will handle its own cache update with server response
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of entityIds) {
        try {
          await handleRelationshipUpdate(id, relationshipName, newValue, true); // Pass true for bulk operation
          successCount++;
        } catch (error) {
          console.error(`Failed to update entity ${id}:`, error);
          errorCount++;
        }
      }
      
      // Show single bulk success toast
      if (successCount > 0) {
        const action = newValue === null ? "cleared" : "updated";
        userDraftToast.custom.success(
          `🔗 Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          `${relationshipName} ${action} for ${successCount} item${successCount > 1 ? 's' : ''}`
        );
      }
      
      if (errorCount === entityIds.length) {
        throw new Error(`All ${errorCount} updates failed`);
      } else if (errorCount > 0) {
        userDraftToast.custom.warning(
          "⚠️ Partial Success",
          `${successCount} updated, ${errorCount} failed`
        );
      }
      
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(['getAllUserDrafts', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], previousData);
      }
      throw error;
    }
  };

  // Prepare relationship configurations for components
  const relationshipConfigs = [
    
  ];

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || Boolean(searchTerm) || Boolean(dateRange.from) || Boolean(dateRange.to);
  const isAllSelected = data && data.length > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < (data?.length || 0);

  // Don't render the table until column visibility is loaded to prevent flash
  if (!isColumnVisibilityLoaded) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-muted-foreground">Loading table configuration...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
      <div className="w-full space-y-4">
      {/* Table Controls */}
      <div className="table-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
                <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Columns</span>
                <span className="sm:hidden">Cols</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2"
                >
                  {columnVisibility[column.id] !== false ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 text-xs sm:text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">⟳</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2 text-xs sm:text-sm"
            disabled={!data || data.length === 0}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="table-container flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {relationshipConfigs.some(config => config.isEditable) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkRelationshipDialog(true)}
                className="gap-2"
              >
                Assign Associations
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
        <div className="table-scroll overflow-x-auto">
          <Table className="w-full min-w-[600px]">
            
            <UserDraftTableHeader 
              onSort={handleSort}
              getSortIcon={getSortIcon}
              filters={filters}
              onFilterChange={handleFilterChange}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onSelectAll={handleSelectAll}
              visibleColumns={visibleColumns}
            />
            <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((userDraft) => (
                <UserDraftTableRow
                  key={userDraft.id}
                  userDraft={userDraft}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  isSelected={selectedRows.has(userDraft.id || 0)}
                  onSelect={handleSelectRow}
                  relationshipConfigs={relationshipConfigs}
                  onRelationshipUpdate={handleRelationshipUpdate}
                  updatingCells={updatingCells}
                  visibleColumns={visibleColumns}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="h-24 text-center"
                >
                  No user drafts found
                  {hasActiveFilters && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Advanced Pagination */}
      <div className="table-container">
        <AdvancedPagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSizeSelector={true}
          showPageInput={true}
          showItemsInfo={true}
          showFirstLastButtons={true}
          maxPageButtons={7}
        />
      </div>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected user drafts and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              userdraft and remove its data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Relationship Assignment Dialog */}
      <BulkRelationshipAssignment
        open={showBulkRelationshipDialog}
        onOpenChange={setShowBulkRelationshipDialog}
        selectedEntityIds={Array.from(selectedRows)}
        relationshipConfigs={relationshipConfigs}
        onBulkUpdate={handleBulkRelationshipUpdate}
      />
      </div>
    </>
  );
}
