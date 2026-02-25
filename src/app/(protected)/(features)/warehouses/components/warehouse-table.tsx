'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  RefreshCw,
  Search,
  Trash2,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InlinePermissionGuard } from '@/core/auth';
import { useDebounce } from '@/hooks/use-debounce';
import { useGetAllOrganizations } from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';

import {
  useDeleteWarehouseMutation,
  useWarehouseCountQuery,
  useWarehousesQuery,
} from '../actions/warehouse-hooks';
import {
  IWarehouse,
  WarehouseListParams,
  WarehouseSearchField,
  WarehouseStatus,
} from '../types/warehouse';

const statusOptions: Array<{ value: 'ALL' | WarehouseStatus; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const searchFieldOptions: Array<{ value: WarehouseSearchField; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'address', label: 'Address' },
];

const pageSizeOptions = [10, 20, 50] as const;

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

type SortField = 'name' | 'code' | 'address' | 'capacity' | 'status';
type SortOrder = 'asc' | 'desc';

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
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<(typeof pageSizeOptions)[number]>(10);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchField, setSearchField] = React.useState<WarehouseSearchField>('name');
  const [status, setStatus] = React.useState<'ALL' | WarehouseStatus>('ACTIVE');
  const [organizationFilter, setOrganizationFilter] = React.useState<string>('ALL');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const [pendingDelete, setPendingDelete] = React.useState<IWarehouse | null>(null);

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const criteriaParams = React.useMemo(() => {
    const params: Omit<WarehouseListParams, 'page' | 'size' | 'sort'> = {};

    if (debouncedSearch) {
      params[`${searchField}.contains`] = debouncedSearch;
    }

    if (status !== 'ALL') {
      params['status.equals'] = status;
    }

    if (organizationFilter !== 'ALL') {
      const parsedOrgId = Number.parseInt(organizationFilter, 10);

      if (Number.isFinite(parsedOrgId)) {
        params['organizationId.equals'] = parsedOrgId;
      }
    }

    return params;
  }, [debouncedSearch, organizationFilter, searchField, status]);

  const listParams: WarehouseListParams = React.useMemo(
    () => ({
      page: page - 1,
      size: pageSize,
      sort: [`${sortField},${sortOrder}`],
      ...criteriaParams,
    }),
    [criteriaParams, page, pageSize, sortField, sortOrder]
  );

  const {
    data: warehouses = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useWarehousesQuery(listParams);

  const { data: totalCount = 0 } = useWarehouseCountQuery(criteriaParams);

  const { mutate: deleteWarehouse, isPending: isDeleting } = useDeleteWarehouseMutation();

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
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  React.useEffect(() => {
    setPage(1);
  }, [criteriaParams, pageSize]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSort = (field: SortField) => {
    setPage(1);
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));

        return prevField;
      }
      setSortOrder('asc');

      return field;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchField('name');
    setStatus('ACTIVE');
    setOrganizationFilter('ALL');
    setSortField('name');
    setSortOrder('asc');
    setPage(1);
  };

  const handleDelete = () => {
    if (!pendingDelete?.id) return;

    deleteWarehouse(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search warehouses"
                placeholder="Search warehouses"
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={searchField}
              onValueChange={(value) => setSearchField(value as WarehouseSearchField)}
            >
              <SelectTrigger aria-label="Search field">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                {searchFieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={organizationFilter}
              onValueChange={setOrganizationFilter}
              aria-label="Filter by organization"
            >
              <SelectTrigger>
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Organizations</SelectItem>
                {selectableOrganizations.map((organization) => (
                  <SelectItem key={organization.id} value={String(organization.id)}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'ALL' | WarehouseStatus)}
              aria-label="Filter by status"
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
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

                          <InlinePermissionGuard requiredPermission="warehouse:delete">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPendingDelete(warehouse)}
                              disabled={isDeleting && pendingDelete?.id === warehouse.id}
                              aria-label={`Delete ${warehouse.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalCount}
          {isFetching ? ' (updating...)' : ''}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              setPageSize(Number.parseInt(value, 10) as (typeof pageSizeOptions)[number])
            }
            aria-label="Rows per page"
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh table"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((prevPage) => Math.max(1, prevPage - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>

          <span className="min-w-16 text-center text-sm text-muted-foreground" aria-live="polite">
            Page {page} / {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((prevPage) => Math.min(totalPages, prevPage + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {pendingDelete?.name || 'this warehouse'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
