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
import { userProfileToast, handleUserProfileError } from "./user-profile-toast";
import { useQueryClient } from '@tanstack/react-query';
import { Search, X, Download, Settings2, Eye, EyeOff } from "lucide-react";
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
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
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
  useGetAllUserProfiles,
  useDeleteUserProfile,
  useCountUserProfiles,
  useUpdateUserProfile,
  usePartialUpdateUserProfile,
  useSearchUserProfiles,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";




// Relationship data imports

import {
  useGetAllPublicUsers
} from "@/core/api/generated/spring/endpoints/public-user-resource/public-user-resource.gen";



import {
  useGetAllChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";



import { UserProfileSearchAndFilters } from "./table/user-profile-search-filters";
import { UserProfileTableHeader } from "./table/user-profile-table-header";
import { UserProfileTableRow } from "./table/user-profile-table-row";
import { BulkRelationshipAssignment } from "./table/bulk-relationship-assignment";

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
    id: 'keycloakId',
    label: 'Keycloak Id',
    accessor: 'keycloakId',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'firstName',
    label: 'First Name',
    accessor: 'firstName',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'lastName',
    label: 'Last Name',
    accessor: 'lastName',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'email',
    label: 'Email',
    accessor: 'email',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'phone',
    label: 'Phone',
    accessor: 'phone',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  {
    id: 'displayName',
    label: 'Display Name',
    accessor: 'displayName',
    type: 'field',
    visible: true,
    sortable: true,
  },
  
  
  {
    id: 'internalUser',
    label: 'Internal User',
    accessor: 'internalUser',
    type: 'relationship',
    visible: true,
    sortable: false,
  },
  
  {
    id: 'channelType',
    label: 'Channel Type',
    accessor: 'channelType',
    type: 'relationship',
    visible: true,
    sortable: false,
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
const COLUMN_VISIBILITY_KEY = 'user-profile-table-columns'; // v2 to force reset for auditing fields

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function UserProfileTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
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
      const oldKey = 'user-profile-table-columns'; // Old key without version
      
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
            
            
            if (col.id === 'internalUser' && relationship) {
              value = relationship.login || '';
            }
            
            
            if (col.id === 'channelType' && relationship) {
              value = relationship.name || '';
            }
            
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
    link.download = `user-profile-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  // Calculate API pagination parameters (0-indexed)
  const apiPage = page - 1;
  const pageSize = 10;

  
  // Fetch relationship data for dropdowns
  
  const { data: userOptions = [] } = useGetAllPublicUsers(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: channeltypeOptions = [] } = useGetAllChannelTypes(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  

  // Helper function to find entity ID by name
  const findEntityIdByName = (entities: any[], name: string, displayField: string = 'name') => {
    const entity = entities?.find(e => e[displayField]?.toLowerCase().includes(name.toLowerCase()));
    return entity?.id;
  };

  // Build filter parameters for API
  const buildFilterParams = () => {
    const params: Record<string, any> = {};
    
    
    // Map relationship filters from name-based to ID-based
    const relationshipMappings = {
      
      'internalUser.login': { 
        apiParam: 'internalUserId.equals', 
        options: userOptions, 
        displayField: 'login' 
      },
      
      'channelType.name': { 
        apiParam: 'channelTypeId.equals', 
        options: channeltypeOptions, 
        displayField: 'name' 
      },
      
    };
    
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        
        // Handle relationship filters
        if (relationshipMappings[key]) {
          const mapping = relationshipMappings[key];
          const entityId = findEntityIdByName(mapping.options, value as string, mapping.displayField);
          if (entityId) {
            params[mapping.apiParam] = entityId;
          }
        }
        
        
        
        
        // Handle createdDate date filter
        else if (key === 'createdDate') {
          if (value instanceof Date) {
            params['createdDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['createdDate.equals'] = value;
          }
        }
        
        // Handle lastModifiedDate date filter
        else if (key === 'lastModifiedDate') {
          if (value instanceof Date) {
            params['lastModifiedDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['lastModifiedDate.equals'] = value;
          }
        }
        
        
        // Handle keycloakId text filter with contains
        else if (key === 'keycloakId') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['keycloakId.contains'] = value;
          }
        }
        
        // Handle firstName text filter with contains
        else if (key === 'firstName') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['firstName.contains'] = value;
          }
        }
        
        // Handle lastName text filter with contains
        else if (key === 'lastName') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['lastName.contains'] = value;
          }
        }
        
        // Handle email text filter with contains
        else if (key === 'email') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['email.contains'] = value;
          }
        }
        
        // Handle phone text filter with contains
        else if (key === 'phone') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['phone.contains'] = value;
          }
        }
        
        // Handle displayName text filter with contains
        else if (key === 'displayName') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['displayName.contains'] = value;
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
    ? useSearchUserProfiles(
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
          },
        }
      )
    : useGetAllUserProfiles(
        {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        },
        {
          query: {
            enabled: true,
          },
        }
      );
  

  // Get total count for pagination
  const { data: countData } = useCountUserProfiles(
    filterParams,
    {
      query: {
        enabled: true,
      },
    }
  );

  // Full update mutation for relationship editing with optimistic updates
  const { mutate: updateEntity, isPending: isUpdating } = useUpdateUserProfile({
    mutation: {
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ 
          queryKey: ['getAllUserProfiles'] 
        });
        
        await queryClient.cancelQueries({ 
          queryKey: ['searchUserProfiles'] 
        });
        

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(['getAllUserProfiles', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }]);

        // Optimistically update the cache
        if (previousData && Array.isArray(previousData)) {
          queryClient.setQueryData(['getAllUserProfiles', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old.map(userProfile => 
              userProfile.id === variables.id 
                ? { ...userProfile, ...variables.data }
                : userProfile
            )
          );
        }

        
        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(['searchUserProfiles', {
            query: searchTerm,
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old?.map(userProfile => 
              userProfile.id === variables.id 
                ? { ...userProfile, ...variables.data }
                : userProfile
            )
          );
        }
        

        return { previousData };
      },
      onSuccess: (data, variables) => {
        // CRITICAL: Update cache with server response to ensure UI reflects actual data
        queryClient.setQueryData(['getAllUserProfiles', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], (old: any[]) => 
          old?.map(userProfile => 
            userProfile.id === variables.id 
              ? data // Use complete server response
              : userProfile
          )
        );

        
        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(['searchUserProfiles', {
            query: searchTerm,
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], (old: any[]) => 
            old?.map(userProfile => 
              userProfile.id === variables.id 
                ? data // Use complete server response
                : userProfile
            )
          );
        }
        

        userProfileToast.updated();
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(['getAllUserProfiles', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], context.previousData);
        }
        handleUserProfileError(error);
      },
      onSettled: () => {
        // Force a background refetch to ensure eventual consistency
        queryClient.invalidateQueries({ 
          queryKey: ['getAllUserProfiles'],
          refetchType: 'none' // Don't refetch immediately, just mark as stale
        });
      },
    },
  });

  // Delete mutation with optimistic updates
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteUserProfile({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['getAllUserProfiles'] });
        
        const previousData = queryClient.getQueryData(['getAllUserProfiles', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }]);

        // Optimistically remove the item
        queryClient.setQueryData(['getAllUserProfiles', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], (old: any[]) => 
          old?.filter(userProfile => userProfile.id !== variables.id)
        );

        return { previousData };
      },
      onSuccess: () => {
        userProfileToast.deleted();
        // Update count cache
        queryClient.setQueryData(['countUserProfiles', filterParams], (old: number) => 
          Math.max(0, (old || 0) - 1)
        );
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(['getAllUserProfiles', {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          }], context.previousData);
        }
        handleUserProfileError(error);
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
    setPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    setPage(1);
  };

  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
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
    await queryClient.cancelQueries({ queryKey: ['getAllUserProfiles'] });
    
    // Get current data for rollback
    const previousData = queryClient.getQueryData(['getAllUserProfiles', {
      page: apiPage,
      size: pageSize,
      sort: [`${sort},${order}`],
      ...filterParams,
    }]);

    try {
      // Optimistically remove all selected items
      queryClient.setQueryData(['getAllUserProfiles', {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      }], (old: any[]) => 
        old?.filter(userProfile => !selectedRows.has(userProfile.id || 0))
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
      userProfileToast.bulkDeleted(selectedRows.size);
      setSelectedRows(new Set());
      
      // Update count cache
      queryClient.setQueryData(['countUserProfiles', filterParams], (old: number) => 
        Math.max(0, (old || 0) - selectedRows.size)
      );
      
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(['getAllUserProfiles', {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        }], previousData);
      }
      userProfileToast.bulkDeleteError();
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
        reject(new Error('UserProfile not found in current data'));
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
            queryClient.setQueryData(['getAllUserProfiles', {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            }], (old: any[]) => 
              old?.map(userProfile => 
                userProfile.id === entityId 
                  ? serverResponse // Use server response
                  : userProfile
              )
            );

            
            // Also update search cache if applicable
            if (searchTerm) {
              queryClient.setQueryData(['searchUserProfiles', {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              }], (old: any[]) => 
                old?.map(userProfile => 
                  userProfile.id === entityId 
                    ? serverResponse // Use server response
                    : userProfile
                )
              );
            }
            
          }

          // Only show individual toast if not part of bulk operation
          if (!isBulkOperation) {
            userProfileToast.relationshipUpdated(relationshipName);
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
    await queryClient.cancelQueries({ queryKey: ['getAllUserProfiles'] });
    
    // Get current data for rollback
    const previousData = queryClient.getQueryData(['getAllUserProfiles', {
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
        userProfileToast.custom.success(
          `🔗 Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          `${relationshipName} ${action} for ${successCount} item${successCount > 1 ? 's' : ''}`
        );
      }
      
      if (errorCount === entityIds.length) {
        throw new Error(`All ${errorCount} updates failed`);
      } else if (errorCount > 0) {
        userProfileToast.custom.warning(
          "⚠️ Partial Success",
          `${successCount} updated, ${errorCount} failed`
        );
      }
      
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(['getAllUserProfiles', {
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
    
    {
      name: "internalUser",
      displayName: "InternalUser",
      options: userOptions || [],
      displayField: "login",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "channelType",
      displayName: "ChannelType",
      options: channeltypeOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
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
            
            <UserProfileTableHeader 
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
              data.map((userProfile) => (
                <UserProfileTableRow
                  key={userProfile.id}
                  userProfile={userProfile}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  isSelected={selectedRows.has(userProfile.id || 0)}
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
                  No user profiles found
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-container">
          <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumbers = [];
              const startPage = Math.max(1, page - 2);
              const endPage = Math.min(totalPages, startPage + 4);
              
              for (let j = startPage; j <= endPage; j++) {
                pageNumbers.push(j);
              }
              
              return pageNumbers[i];
            }).filter(Boolean).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                  isActive={page === p}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        </div>
      )}

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected user profiles and remove their data from the server.
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
              userprofile and remove its data from the server.
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
