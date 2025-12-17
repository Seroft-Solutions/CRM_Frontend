'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Eye, EyeOff, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCountSystemConfigs,
  useGetAllSystemConfigs,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { SystemConfigTableHeader } from './table/system-config-table-header';
import { SystemConfigTableRow } from './table/system-config-table-row';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

const TABLE_CONFIG = {
  showDraftTab: false,
  centerAlignActions: true,
};

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    max-width: 100%;
  }
  @media (min-width: 1024px) {
    .table-container {
      max-width: 100%;
    }
  }

  .table-scroll td {
    white-space: normal;
    word-break: break-word;
  }
`;

const ASC = 'asc';
const DESC = 'desc';

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

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
    id: 'configKey',
    label: 'Config Key',
    accessor: 'configKey',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'systemConfigType',
    label: 'Config Type',
    accessor: 'systemConfigType',
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
    visible: false,
    sortable: true,
  },
  {
    id: 'createdDate',
    label: 'Created Date',
    accessor: 'createdDate',
    type: 'field',
    visible: false,
    sortable: true,
  },
  {
    id: 'lastModifiedBy',
    label: 'Last Modified By',
    accessor: 'lastModifiedBy',
    type: 'field',
    visible: false,
    sortable: true,
  },
  {
    id: 'lastModifiedDate',
    label: 'Last Modified Date',
    accessor: 'lastModifiedDate',
    type: 'field',
    visible: false,
    sortable: true,
  },
];

const COLUMN_VISIBILITY_KEY = 'system-config-table-columns';

export function SystemConfigTable() {
  const queryClient = useQueryClient();

  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState(ASC);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const [filters, setFilters] = useState<FilterState>({});

  const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedVisibility = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (savedVisibility) {
        setColumnVisibility(JSON.parse(savedVisibility));
      } else {
        const defaultVisibility = ALL_COLUMNS.reduce(
          (acc, col) => ({ ...acc, [col.id]: col.visible }),
          {}
        );
        setColumnVisibility(defaultVisibility);
      }
    } catch (error) {
      console.error('Failed to load column visibility:', error);
    } finally {
      setIsColumnVisibilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isColumnVisibilityLoaded) return;

    try {
      localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
    } catch (error) {
      console.error('Failed to save column visibility:', error);
    }
  }, [columnVisibility, isColumnVisibilityLoaded]);

  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false,
    }));
  };

  const handleFilterChange = (column: string, value: any) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '' || value === null) {
        delete next[column];
      } else {
        next[column] = value;
      }
      return next;
    });
    resetPagination();
  };

  const clearAllFilters = () => {
    setFilters({});
    resetPagination();
  };

  const getStatusForQuery = (statusTab: string) => {
    const statusMap: Record<string, string> = {
      draft: SystemConfigDTOStatus.DRAFT,
      active: SystemConfigDTOStatus.ACTIVE,
      inactive: SystemConfigDTOStatus.INACTIVE,
      archived: SystemConfigDTOStatus.ARCHIVED,
    };
    return statusMap[statusTab] || SystemConfigDTOStatus.ACTIVE;
  };

  const currentStatus = getStatusForQuery(activeStatusTab);

  const buildFilterParams = () => {
    const params: Record<string, any> =
      activeStatusTab === 'all'
        ? {}
        : {
            'status.equals': currentStatus,
          };

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) return;

      if (key === 'id') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          params['id.equals'] = parsed;
        }
        return;
      }

      if (key === 'createdDate') {
        params['createdDate.equals'] = value;
        return;
      }

      if (key === 'lastModifiedDate') {
        params['lastModifiedDate.equals'] = value;
        return;
      }

      if (typeof value === 'string' && value.trim() !== '') {
        params[`${key}.contains`] = value;
      }
    });

    return params;
  };

  const filterParams = buildFilterParams();

  const apiPage = page - 1;

  const { data, isLoading, error, refetch } = useGetAllSystemConfigs({
    page: apiPage,
    size: pageSize,
    sort: [`${sort},${order}`],
    ...filterParams,
  });

  const { data: countData } = useCountSystemConfigs(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const updateMutation = useUpdateSystemConfig();

  const handleStatusChange = async (id: number, status: SystemConfigDTOStatus) => {
    const currentEntity = data?.find((item) => item.id === id);
    if (!currentEntity) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: { ...currentEntity, id, status },
      });

      if (status === SystemConfigDTOStatus.ACTIVE) {
        toast.success('System config activated successfully');
      } else if (status === SystemConfigDTOStatus.INACTIVE) {
        toast.success('System config deactivated successfully');
      } else {
        toast.success('System config updated successfully');
      }

      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/system-configs' ||
          query.queryKey[0] === '/api/system-configs/count',
      });
    } catch (error) {
      toast.error('Failed to update system config status');
      console.error(error);
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;

    const itemToArchive = data?.find((item) => item.id === archiveId);
    if (!itemToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: archiveId,
        data: { ...itemToArchive, status: SystemConfigDTOStatus.ARCHIVED },
      });

      toast.success('System config archived successfully');
      setShowArchiveDialog(false);
      setArchiveId(null);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/system-configs' ||
          query.queryKey[0] === '/api/system-configs/count',
      });
    } catch (error) {
      toast.error('Failed to archive system config');
      console.error(error);
    }
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === ASC ? DESC : ASC);
    } else {
      setSort(column);
      setOrder(ASC);
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = visibleColumns.map((col) => col.label);
    const csvContent = [
      headers.join(','),
      ...data.map((item) =>
        visibleColumns
          .map((col) => {
            let value = '';
            const fieldValue = (item as any)?.[col.accessor];
            value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';

            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"') || value.includes('\n'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-config-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const totalItems = countData || 0;
  const hasActiveFilters = Object.keys(filters).length > 0;

  if (!isColumnVisibilityLoaded) {
    return (
      <>
        <style>{tableScrollStyles}</style>
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

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading system configs. Please try again.
      </div>
    );
  }

  return (
    <>
      <style>{tableScrollStyles}</style>
      <div className="space-y-4">
        {/* Status Tabs */}
        <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full">
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

        {/* Table */}
        <div className="rounded-md border table-container">
          <div className="overflow-x-auto table-scroll">
            <Table>
              <SystemConfigTableHeader
                columns={visibleColumns}
                sort={sort}
                order={order}
                onSort={handleSort}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((item) => (
                    <SystemConfigTableRow
                      key={item.id}
                      item={item}
                      columns={visibleColumns}
                      onArchive={(id) => {
                        setArchiveId(id);
                        setShowArchiveDialog(true);
                      }}
                      onStatusChange={handleStatusChange}
                      isUpdatingStatus={updateMutation.isPending}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                      No results.
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
      </div>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive System Config</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this system config? This action can be reversed by
              changing the status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
