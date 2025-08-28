// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { channelTypeToast, handleChannelTypeError } from './channel-type-toast';
import { ChannelTypeDTOStatus } from '@/core/api/generated/spring/schemas/ChannelTypeDTOStatus';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  X,
  Download,
  Settings2,
  Eye,
  EyeOff,
  RefreshCw,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Configuration for table features
const TABLE_CONFIG = {
  showDraftTab: false, // Set to true to show Draft tab
  centerAlignActions: true, // Center align action icons
};

// Utility function to transform enum values from UPPERCASE to Title Case
function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
  useGetAllChannelTypes,
  useDeleteChannelType,
  useCountChannelTypes,
  useUpdateChannelType,
  usePartialUpdateChannelType,
  useSearchChannelTypes,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';

import { ChannelTypeSearchAndFilters } from './table/channel-type-search-filters';
import { ChannelTypeTableHeader } from './table/channel-type-table-header';
import { ChannelTypeTableRow } from './table/channel-type-table-row';
import { BulkRelationshipAssignment } from './table/bulk-relationship-assignment';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

// Define sort ordering constants
const ASC = 'asc';
const DESC = 'desc';

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
    id: 'name',
    label: 'Name',
    accessor: 'name',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'description',
    label: 'Description',
    accessor: 'description',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'commissionRate',
    label: 'Commission Rate',
    accessor: 'commissionRate',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'status',
    label: 'Status',
    accessor: 'status',
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
const COLUMN_VISIBILITY_KEY = 'channel-type-table-columns'; // v2 to force reset for auditing fields

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function ChannelTypeTable() {
  const queryClient = useQueryClient();

  // Enhanced pagination state management
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10); // Default to 25 items per page

  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState(ASC);
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [showBulkStatusChangeDialog, setShowBulkStatusChangeDialog] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<string | null>(null);
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
      const oldKey = 'channel-type-table-columns'; // Old key without version

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
        const defaultVisibility = ALL_COLUMNS.reduce(
          (acc, col) => ({
            ...acc,
            [col.id]: col.visible,
          }),
          {}
        );
        setColumnVisibility(defaultVisibility);
      }
    } catch (error) {
      console.warn('Failed to load column visibility from localStorage:', error);
      // Fallback to default visibility
      const defaultVisibility = ALL_COLUMNS.reduce(
        (acc, col) => ({
          ...acc,
          [col.id]: col.visible,
        }),
        {}
      );
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
    return ALL_COLUMNS.filter((col) => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Manual refresh functionality
  const handleRefresh = async () => {
    try {
      // Invalidate all related queries to force fresh data
      await queryClient.invalidateQueries({
        queryKey: ['getAllChannelTypes'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countChannelTypes'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchChannelTypes'],
        refetchType: 'active',
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

    const headers = visibleColumns.map((col) => col.label);
    const csvContent = [
      headers.join(','),
      ...data.map((item) => {
        return visibleColumns
          .map((col) => {
            let value = '';
            if (col.type === 'field') {
              const fieldValue = item[col.accessor as keyof typeof item];
              value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
            } else if (col.type === 'relationship') {
              const relationship = item[col.accessor as keyof typeof item] as any;
            }
            // Escape CSV values
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"') || value.includes('\n'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `channel-type-export-${new Date().toISOString().split('T')[0]}.csv`;
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
    const entity = entities?.find((e) =>
      e[displayField]?.toLowerCase().includes(name.toLowerCase())
    );
    return entity?.id;
  };

  // Status configuration
  const statusOptions = [
    {
      value: ChannelTypeDTOStatus.DRAFT,
      label: transformEnumValue('DRAFT'),
      color: 'bg-gray-100 text-gray-800',
    },
    {
      value: ChannelTypeDTOStatus.ACTIVE,
      label: transformEnumValue('ACTIVE'),
      color: 'bg-green-100 text-green-800',
    },
    {
      value: ChannelTypeDTOStatus.INACTIVE,
      label: transformEnumValue('INACTIVE'),
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: ChannelTypeDTOStatus.ARCHIVED,
      label: transformEnumValue('ARCHIVED'),
      color: 'bg-red-100 text-red-800',
    },
  ];

  // Get status filter based on active tab
  const getStatusFilter = () => {
    switch (activeStatusTab) {
      case 'draft':
        return { 'status.equals': ChannelTypeDTOStatus.DRAFT };
      case 'active':
        return { 'status.equals': ChannelTypeDTOStatus.ACTIVE };
      case 'inactive':
        return { 'status.equals': ChannelTypeDTOStatus.INACTIVE };
      case 'archived':
        return { 'status.equals': ChannelTypeDTOStatus.ARCHIVED };
      case 'all':
        return {};
      default:
        return { 'status.equals': ChannelTypeDTOStatus.ACTIVE };
    }
  };

  // Build filter parameters for API
  const buildFilterParams = () => {
    const params: Record<string, any> = {
      ...getStatusFilter(), // Add status filtering based on active tab
    };

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
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

        // Handle name text filter with contains
        else if (key === 'name') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['name.contains'] = value;
          }
        }

        // Handle description text filter with contains
        else if (key === 'description') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['description.contains'] = value;
          }
        }

        // Handle commissionRate text filter with contains
        else if (key === 'commissionRate') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['commissionRate.contains'] = value;
          }
        }

        // Handle status text filter with contains
        else if (key === 'status') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['status.contains'] = value;
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
    ? useSearchChannelTypes(
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
    : useGetAllChannelTypes(
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
  const { data: countData } = useCountChannelTypes(filterParams, {
    query: {
      enabled: true,
      staleTime: 0, // Always consider data stale for immediate refetch
      refetchOnWindowFocus: true,
    },
  });

  // Full update mutation for relationship editing with optimistic updates
  const { mutate: updateEntity, isPending: isUpdating } = useUpdateChannelType({
    mutation: {
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ['getAllChannelTypes'],
        });

        await queryClient.cancelQueries({
          queryKey: ['searchChannelTypes'],
        });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData([
          'getAllChannelTypes',
          {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          },
        ]);

        // Optimistically update the cache
        if (previousData && Array.isArray(previousData)) {
          queryClient.setQueryData(
            [
              'getAllChannelTypes',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old.map((channelType) =>
                channelType.id === variables.id
                  ? { ...channelType, ...variables.data }
                  : channelType
              )
          );
        }

        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchChannelTypes',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old?.map((channelType) =>
                channelType.id === variables.id
                  ? { ...channelType, ...variables.data }
                  : channelType
              )
          );
        }

        return { previousData };
      },
      onSuccess: (data, variables) => {
        // CRITICAL: Update cache with server response to ensure UI reflects actual data
        queryClient.setQueryData(
          [
            'getAllChannelTypes',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          (old: any[]) =>
            old?.map((channelType) =>
              channelType.id === variables.id
                ? data // Use complete server response
                : channelType
            )
        );

        // Also update search cache if applicable
        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchChannelTypes',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old?.map((channelType) =>
                channelType.id === variables.id
                  ? data // Use complete server response
                  : channelType
              )
          );
        }

        channelTypeToast.updated();
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllChannelTypes',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            context.previousData
          );
        }
        handleChannelTypeError(error);
      },
      onSettled: async () => {
        // Force active refetch to ensure immediate consistency
        await queryClient.invalidateQueries({
          queryKey: ['getAllChannelTypes'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countChannelTypes'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchChannelTypes'],
          refetchType: 'active',
        });
      },
    },
  });

  // Status update mutation for soft delete (archive) with optimistic updates
  const { mutate: updateEntityStatus, isPending: isUpdatingStatus } = useUpdateChannelType({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['getAllChannelTypes'] });

        const previousData = queryClient.getQueryData([
          'getAllChannelTypes',
          {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          },
        ]);

        // Optimistically update or remove the item based on status change
        queryClient.setQueryData(
          [
            'getAllChannelTypes',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          (old: any[]) => {
            if (!old) return old;

            // If the new status matches the current filter, update in place
            // Otherwise, remove from current view
            const newStatus = variables.data.status;
            const currentFilter = getStatusFilter();
            const currentStatusFilter = currentFilter['status.equals'];

            // Debug logging to help troubleshoot
            console.log('Optimistic Update Debug:', {
              newStatus,
              currentStatusFilter,
              activeStatusTab,
              shouldStayInView: currentStatusFilter === newStatus || activeStatusTab === 'all',
              comparison: `${currentStatusFilter} === ${newStatus}`,
              entityId: variables.id,
            });

            if (currentStatusFilter === newStatus || activeStatusTab === 'all') {
              // Update in place - status matches current tab filter
              console.log(`Updating item ${variables.id} in place`);
              return old.map((channelType) =>
                channelType.id === variables.id
                  ? { ...channelType, ...variables.data }
                  : channelType
              );
            } else {
              // Remove from current filtered view - status no longer matches tab filter
              console.log(`Removing item ${variables.id} from current view`);
              return old.filter((channelType) => channelType.id !== variables.id);
            }
          }
        );

        return { previousData };
      },
      onSuccess: (data, variables) => {
        const statusLabel =
          statusOptions.find((opt) => opt.value.includes(variables.data.status))?.label ||
          variables.data.status;
        channelTypeToast.custom.success(
          `Status Updated`,
          `ChannelType status changed to ${statusLabel}`
        );

        // Update count cache if item was removed from current view
        const currentFilter = getStatusFilter();
        const currentStatusFilter = currentFilter['status.equals'];
        const newStatus = variables.data.status;

        if (currentStatusFilter !== newStatus && activeStatusTab !== 'all') {
          console.log(
            `Updating count cache - removing 1 item due to status change from ${currentStatusFilter} to ${newStatus}`
          );
          queryClient.setQueryData(['countChannelTypes', filterParams], (old: number) =>
            Math.max(0, (old || 0) - 1)
          );
        }
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllChannelTypes',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            context.previousData
          );
        }
        handleChannelTypeError(error);
      },
      onSettled: async () => {
        // Force active refetch to ensure immediate consistency
        await queryClient.invalidateQueries({
          queryKey: ['getAllChannelTypes'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countChannelTypes'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchChannelTypes'],
          refetchType: 'active',
        });
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
      return 'ChevronsUpDown';
    }
    return order === ASC ? 'ChevronUp' : 'ChevronDown';
  };

  // Handle status change (archive by default)
  const handleArchive = (id: number) => {
    setArchiveId(id);
    setShowArchiveDialog(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    setStatusChangeId(id);
    setNewStatus(status);
    setShowStatusChangeDialog(true);
  };

  const confirmArchive = () => {
    if (archiveId) {
      const currentEntity = data?.find((item) => item.id === archiveId);
      if (currentEntity) {
        updateEntityStatus({
          id: archiveId,
          data: { ...currentEntity, status: ChannelTypeDTOStatus.ARCHIVED },
        });
      }
    }
    setShowArchiveDialog(false);
    setArchiveId(null);
  };

  const confirmStatusChange = () => {
    if (statusChangeId && newStatus) {
      const currentEntity = data?.find((item) => item.id === statusChangeId);
      if (currentEntity) {
        const statusValue = ChannelTypeDTOStatus[newStatus as keyof typeof ChannelTypeDTOStatus];
        updateEntityStatus({
          id: statusChangeId,
          data: { ...currentEntity, status: statusValue },
        });
      }
    }
    setShowStatusChangeDialog(false);
    setStatusChangeId(null);
    setNewStatus(null);
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    resetPagination(); // Reset to page 1 when filters change
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
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
      setSelectedRows(
        new Set(data.map((item) => item.id).filter((id): id is number => id !== undefined))
      );
    }
  };

  // Handle bulk archive
  const handleBulkArchive = () => {
    setShowBulkArchiveDialog(true);
  };

  // Handle bulk status change
  const handleBulkStatusChange = (status: string) => {
    setBulkNewStatus(status);
    setShowBulkStatusChangeDialog(true);
  };

  const confirmBulkArchive = async () => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['getAllChannelTypes'] });

    // Get current data for rollback
    const previousData = queryClient.getQueryData([
      'getAllChannelTypes',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      // Process status updates to ARCHIVED
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = data?.find((item) => item.id === id);
        if (currentEntity) {
          return new Promise<void>((resolve, reject) => {
            updateEntityStatus(
              {
                id,
                data: { ...currentEntity, status: ChannelTypeDTOStatus.ARCHIVED },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Force refetch to ensure table is up to date
      await queryClient.invalidateQueries({
        queryKey: ['getAllChannelTypes'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countChannelTypes'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchChannelTypes'],
        refetchType: 'active',
      });

      channelTypeToast.custom.success(
        'Bulk Archive Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} archived successfully`
      );
      setSelectedRows(new Set());
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllChannelTypes',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      channelTypeToast.custom.error(
        'Bulk Archive Failed',
        'Some items could not be archived. Please try again.'
      );
    }
    setShowBulkArchiveDialog(false);
  };

  const confirmBulkStatusChange = async () => {
    if (!bulkNewStatus) return;

    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['getAllChannelTypes'] });

    // Get current data for rollback
    const previousData = queryClient.getQueryData([
      'getAllChannelTypes',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      // Process bulk status updates
      const statusValue = ChannelTypeDTOStatus[bulkNewStatus as keyof typeof ChannelTypeDTOStatus];
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = data?.find((item) => item.id === id);
        if (currentEntity) {
          return new Promise<void>((resolve, reject) => {
            updateEntityStatus(
              {
                id,
                data: { ...currentEntity, status: statusValue },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Force refetch to ensure table is up to date
      await queryClient.invalidateQueries({
        queryKey: ['getAllChannelTypes'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countChannelTypes'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchChannelTypes'],
        refetchType: 'active',
      });

      const statusLabel =
        statusOptions.find((opt) => opt.value.includes(bulkNewStatus))?.label || bulkNewStatus;
      channelTypeToast.custom.success(
        'Bulk Status Update Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} updated to ${statusLabel}`
      );
      setSelectedRows(new Set());
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllChannelTypes',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      channelTypeToast.custom.error(
        'Bulk Status Update Failed',
        'Some items could not be updated. Please try again.'
      );
    }
    setShowBulkStatusChangeDialog(false);
    setBulkNewStatus(null);
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
    setUpdatingCells((prev) => new Set(prev).add(cellKey));

    return new Promise<void>((resolve, reject) => {
      // Get the current entity data first
      const currentEntity = data?.find((item) => item.id === entityId);
      if (!currentEntity) {
        setUpdatingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        reject(new Error('ChannelType not found in current data'));
        return;
      }

      // Create complete update data with current values, then update the specific relationship
      const updateData: any = {
        ...currentEntity,
        id: entityId,
      };

      // Update only the specific relationship
      if (newValue) {
        // Find the full relationship object from options
        const relationshipConfig = relationshipConfigs.find(
          (config) => config.name === relationshipName
        );
        const selectedOption = relationshipConfig?.options.find((opt) => opt.id === newValue);
        updateData[relationshipName] = selectedOption || { id: newValue };
      } else {
        updateData[relationshipName] = null;
      }

      updateEntity(
        {
          id: entityId,
          data: updateData,
        },
        {
          onSuccess: (serverResponse) => {
            // CRITICAL: Ensure individual cache updates with server response for bulk operations
            if (isBulkOperation) {
              // Update cache with server response for this specific entity
              queryClient.setQueryData(
                [
                  'getAllChannelTypes',
                  {
                    page: apiPage,
                    size: pageSize,
                    sort: [`${sort},${order}`],
                    ...filterParams,
                  },
                ],
                (old: any[]) =>
                  old?.map((channelType) =>
                    channelType.id === entityId
                      ? serverResponse // Use server response
                      : channelType
                  )
              );

              // Also update search cache if applicable
              if (searchTerm) {
                queryClient.setQueryData(
                  [
                    'searchChannelTypes',
                    {
                      query: searchTerm,
                      page: apiPage,
                      size: pageSize,
                      sort: [`${sort},${order}`],
                      ...filterParams,
                    },
                  ],
                  (old: any[]) =>
                    old?.map((channelType) =>
                      channelType.id === entityId
                        ? serverResponse // Use server response
                        : channelType
                    )
                );
              }
            }

            // Only show individual toast if not part of bulk operation
            if (!isBulkOperation) {
              channelTypeToast.relationshipUpdated(relationshipName);
            }
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
          onSettled: () => {
            // Remove this cell from updating state
            setUpdatingCells((prev) => {
              const newSet = new Set(prev);
              newSet.delete(cellKey);
              return newSet;
            });
          },
        }
      );
    });
  };

  // Handle bulk relationship updates with individual server response syncing
  const handleBulkRelationshipUpdate = async (
    entityIds: number[],
    relationshipName: string,
    newValue: number | null
  ) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['getAllChannelTypes'] });

    // Get current data for rollback
    const previousData = queryClient.getQueryData([
      'getAllChannelTypes',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

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
        const action = newValue === null ? 'cleared' : 'updated';
        channelTypeToast.custom.success(
          `🔗 Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          `${relationshipName} ${action} for ${successCount} item${successCount > 1 ? 's' : ''}`
        );
      }

      if (errorCount === entityIds.length) {
        throw new Error(`All ${errorCount} updates failed`);
      } else if (errorCount > 0) {
        channelTypeToast.custom.warning(
          '⚠️ Partial Success',
          `${successCount} updated, ${errorCount} failed`
        );
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllChannelTypes',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      throw error;
    }
  };

  // Prepare relationship configurations for components
  const relationshipConfigs = [];

  // Check if any filters are active
  const hasActiveFilters =
    Object.keys(filters).length > 0 ||
    Boolean(searchTerm) ||
    Boolean(dateRange.from) ||
    Boolean(dateRange.to);
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
        {/* Status Filter Tabs */}
        <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab}>
          <TabsList
            className={`grid w-full ${TABLE_CONFIG.showDraftTab ? 'grid-cols-5' : 'grid-cols-4'}`}
          >
            <TabsTrigger value="active" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Inactive
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Archived
            </TabsTrigger>
            {TABLE_CONFIG.showDraftTab && (
              <TabsTrigger value="draft" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Draft
              </TabsTrigger>
            )}
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

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
              {relationshipConfigs.some((config) => config.isEditable) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkRelationshipDialog(true)}
                  className="gap-2"
                >
                  Assign Associations
                </Button>
              )}

              {/* Bulk Status Change Dropdown */}
              <Select onValueChange={(status) => handleBulkStatusChange(status)}>
                <SelectTrigger className="w-auto">
                  <SelectValue
                    placeholder={
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Change Status
                      </div>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-green-600" />
                      Set {transformEnumValue('ACTIVE')}
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Set {transformEnumValue('INACTIVE')}
                    </div>
                  </SelectItem>
                  <SelectItem value="ARCHIVED">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-red-600" />
                      {transformEnumValue('ARCHIVED')}
                    </div>
                  </SelectItem>
                  {TABLE_CONFIG.showDraftTab && (
                    <SelectItem value="DRAFT">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-gray-400 rounded" />
                        Set {transformEnumValue('DRAFT')}
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {activeStatusTab !== 'archived' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkArchive}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive Selected
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="table-scroll overflow-x-auto">
            <Table className="w-full min-w-[600px]">
              <ChannelTypeTableHeader
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
                    <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.length ? (
                  data.map((channelType) => (
                    <ChannelTypeTableRow
                      key={channelType.id}
                      channelType={channelType}
                      onArchive={handleArchive}
                      onStatusChange={handleStatusChange}
                      isUpdatingStatus={isUpdatingStatus}
                      statusOptions={statusOptions}
                      isSelected={selectedRows.has(channelType.id || 0)}
                      onSelect={handleSelectRow}
                      relationshipConfigs={relationshipConfigs}
                      onRelationshipUpdate={handleRelationshipUpdate}
                      updatingCells={updatingCells}
                      visibleColumns={visibleColumns}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                      No channel types found
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

        {/* Bulk Archive Dialog */}
        <AlertDialog open={showBulkArchiveDialog} onOpenChange={setShowBulkArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Archive {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status of the selected channel types to "Archived". They will
                no longer appear in the active view but can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkArchive}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Status Change Dialog */}
        <AlertDialog open={showBulkStatusChangeDialog} onOpenChange={setShowBulkStatusChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Change Status for {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will update the status of the selected channel types to "
                {statusOptions.find((opt) => opt.value.includes(bulkNewStatus || ''))?.label ||
                  bulkNewStatus}
                ".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkStatusChange}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Archive Dialog */}
        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this channeltype?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status to "Archived". The channeltype will no longer appear in
                the active view but can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmArchive}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Change Dialog */}
        <AlertDialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Status</AlertDialogTitle>
              <AlertDialogDescription>
                Change the status of this channeltype to "
                {statusOptions.find((opt) => opt.value.includes(newStatus || ''))?.label ||
                  newStatus}
                "?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Status
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
