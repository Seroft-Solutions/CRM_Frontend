'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreVertical,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InlinePermissionGuard } from '@/core/auth';
import { useGetAllOrganizations } from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';
import { useDebounce } from '@/hooks/use-debounce';

import {
  useSearchWarehousesQuery,
  useWarehouseCountQuery,
  useUpdateWarehouseMutation,
  useWarehousesQuery,
} from '../actions/warehouse-hooks';
import { IWarehouse, WarehouseListParams, WarehouseStatus } from '../types/warehouse';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';
import { WarehouseFilterState, WarehouseSearchAndFilters } from './table/warehouse-search-filters';

type WarehouseStatusTab = 'active' | 'inactive' | 'draft' | 'archived' | 'all';
type SortField = 'name' | 'code' | 'address' | 'capacity' | 'status';
type SortOrder = 'asc' | 'desc';

const statusBadgeClass: Record<WarehouseStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ARCHIVED: 'bg-red-100 text-red-700 border-red-200',
};

const formatStatus = (status: WarehouseStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { title?: string; detail?: string; message?: string } };
      message?: string;
    };

    return (
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.message ||
      maybeAxiosError.message ||
      fallback
    );
  }

  return fallback;
};

const getStatusFilterFromTab = (tab: WarehouseStatusTab): Partial<WarehouseListParams> => {
  switch (tab) {
    case 'active':
      return { 'status.equals': 'ACTIVE' };
    case 'inactive':
      return { 'status.equals': 'INACTIVE' };
    case 'draft':
      return { 'status.equals': 'DRAFT' };
    case 'archived':
      return { 'status.equals': 'ARCHIVED' };
    case 'all':
      return {};
    default:
      return { 'status.equals': 'ACTIVE' };
  }
};

interface SortableHeadProps {
  label: string;
  field: SortField;
  currentSortField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortableHead({ label, field, currentSortField, currentOrder, onSort }: SortableHeadProps) {
  const isActive = currentSortField === field;

  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium text-left hover:text-foreground"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4" />
        )}
      </button>
    </TableHead>
  );
}

export function WarehouseTable() {
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState<WarehouseFilterState>({});
  const [activeStatusTab, setActiveStatusTab] = React.useState<WarehouseStatusTab>('active');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const [pendingStatusChange, setPendingStatusChange] = React.useState<{
    warehouse: IWarehouse;
    status: WarehouseStatus;
  } | null>(null);

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const criteriaParams = React.useMemo<
    Omit<WarehouseListParams, 'page' | 'size' | 'sort' | 'query'>
  >(() => {
    const params: Omit<WarehouseListParams, 'page' | 'size' | 'sort' | 'query'> = {
      ...getStatusFilterFromTab(activeStatusTab),
    };

    if (filters.name?.trim()) {
      params['name.contains'] = filters.name.trim();
    }

    if (filters.code?.trim()) {
      params['code.contains'] = filters.code.trim();
    }

    if (filters.address?.trim()) {
      params['address.contains'] = filters.address.trim();
    }

    if (filters.capacity?.trim()) {
      const capacity = Number.parseInt(filters.capacity, 10);

      if (Number.isFinite(capacity)) {
        params['capacity.equals'] = capacity;
      }
    }

    if (filters.organizationId?.trim()) {
      const organizationId = Number.parseInt(filters.organizationId, 10);

      if (Number.isFinite(organizationId)) {
        params['organizationId.equals'] = organizationId;
      }
    }

    return params;
  }, [activeStatusTab, filters]);

  const listParams: WarehouseListParams = React.useMemo(
    () => ({
      page: page - 1,
      size: pageSize,
      sort: [`${sortField},${sortOrder}`],
      ...criteriaParams,
    }),
    [criteriaParams, page, pageSize, sortField, sortOrder]
  );

  const listQuery = useWarehousesQuery(listParams, {
    enabled: !Boolean(debouncedSearch),
  });

  const searchQuery = useSearchWarehousesQuery(
    {
      ...listParams,
      query: debouncedSearch || '',
    },
    {
      enabled: Boolean(debouncedSearch),
    }
  );

  const activeQuery = debouncedSearch ? searchQuery : listQuery;

  const { data: warehouses = [], isLoading, isError, error, isFetching, refetch } = activeQuery;

  const { data: totalCount = 0 } = useWarehouseCountQuery(criteriaParams);
  const { mutate: updateWarehouse, isPending: isUpdatingStatus } = useUpdateWarehouseMutation();

  const { data: organizations = [] } = useGetAllOrganizations(
    { page: 0, size: 1000, sort: ['name,asc'] },
    {
      query: {
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const selectableOrganizations = React.useMemo(
    () =>
      organizations.filter(
        (organization): organization is typeof organization & { id: number } =>
          typeof organization.id === 'number'
      ),
    [organizations]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  React.useEffect(() => {
    if (page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [handlePageChange, page, totalPages]);

  const handleSort = (field: SortField) => {
    setSortField((currentSortField) => {
      if (currentSortField === field) {
        setSortOrder((currentSortOrder) => (currentSortOrder === 'asc' ? 'desc' : 'asc'));

        return currentSortField;
      }

      setSortOrder('asc');

      return field;
    });
    resetPagination();
  };

  const handleStatusTabChange = (value: string) => {
    setActiveStatusTab(value as WarehouseStatusTab);
    resetPagination();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    resetPagination();
  };

  const handleFilterChange = (column: keyof WarehouseFilterState, value?: string) => {
    setFilters((prev) => {
      const next = { ...prev };

      if (!value || value.trim() === '') {
        delete next[column];
      } else {
        next[column] = value;
      }

      return next;
    });
    resetPagination();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({});
    setActiveStatusTab('active');
    setSortField('name');
    setSortOrder('asc');
    resetPagination();
  };

  const handleStatusChange = (warehouse: IWarehouse, status: WarehouseStatus) => {
    setPendingStatusChange({ warehouse, status });
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange?.warehouse.id) {
      return;
    }

    updateWarehouse(
      {
        id: pendingStatusChange.warehouse.id,
        warehouse: {
          ...pendingStatusChange.warehouse,
          status: pendingStatusChange.status,
        },
      },
      {
        onSuccess: () => {
          setPendingStatusChange(null);
        },
      }
    );
  };

  const hasActiveFilters =
    activeStatusTab !== 'active' ||
    Boolean(searchTerm.trim()) ||
    Object.keys(filters).length > 0 ||
    sortField !== 'name' ||
    sortOrder !== 'asc';

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeStatusTab} onValueChange={handleStatusTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            Inactive
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            Archived
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            Draft
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border bg-card p-4">
        <WarehouseSearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          organizations={selectableOrganizations}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        {isError ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Unable to load warehouses</p>
              <p className="text-sm text-muted-foreground">
                {getErrorMessage(error, 'Please try again.')}
              </p>
            </div>
            <Button type="button" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Name"
                    field="name"
                    currentSortField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Code"
                    field="code"
                    currentSortField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Address"
                    field="address"
                    currentSortField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead>Organization</TableHead>
                  <SortableHead
                    label="Capacity"
                    field="capacity"
                    currentSortField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Status"
                    field="status"
                    currentSortField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading warehouses...
                    </TableCell>
                  </TableRow>
                ) : warehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No warehouses found.
                      {hasActiveFilters && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Try adjusting your filters.
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {warehouse.code}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate" title={warehouse.address || ''}>
                        {warehouse.address || '—'}
                      </TableCell>
                      <TableCell>{warehouse.organizationName || '—'}</TableCell>
                      <TableCell>{warehouse.capacity ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass[warehouse.status]}>
                          {formatStatus(warehouse.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <InlinePermissionGuard requiredPermission="warehouse:update">
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Edit ${warehouse.name}`}
                            >
                              <Link href={`/warehouses/${warehouse.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </InlinePermissionGuard>

                          <InlinePermissionGuard requiredPermission="warehouse:update">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={isUpdatingStatus}
                                  aria-label={`Status actions for ${warehouse.name}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {warehouse.status !== 'ACTIVE' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(warehouse, 'ACTIVE')}
                                    className="text-green-700"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Set Active
                                  </DropdownMenuItem>
                                )}
                                {warehouse.status !== 'INACTIVE' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(warehouse, 'INACTIVE')}
                                    className="text-yellow-700"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Set Inactive
                                  </DropdownMenuItem>
                                )}
                                {warehouse.status !== 'DRAFT' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(warehouse, 'DRAFT')}
                                    className="text-slate-700"
                                  >
                                    <div className="mr-2 h-4 w-4 rounded border border-current" />
                                    Set Draft
                                  </DropdownMenuItem>
                                )}
                                {warehouse.status !== 'ARCHIVED' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(warehouse, 'ARCHIVED')}
                                      className="text-red-700"
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </InlinePermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh warehouse table"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>

        <AdvancedPagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading || isFetching}
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSizeSelector={true}
          showPageInput={true}
          showItemsInfo={true}
          showFirstLastButtons={true}
          maxPageButtons={7}
        />
      </div>

      <AlertDialog
        open={!!pendingStatusChange}
        onOpenChange={(open) => !open && setPendingStatusChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change warehouse status?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange?.warehouse.name || 'This warehouse'} will be changed to{' '}
              {pendingStatusChange ? formatStatus(pendingStatusChange.status) : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
