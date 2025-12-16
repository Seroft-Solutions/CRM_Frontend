'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
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
  useCountSystemConfigAttributes,
  useGetAllSystemConfigAttributes,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import {
  AlertTriangle,
  Archive,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';
import { InlinePermissionGuard } from '@/core/auth';

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
  { id: 'id', label: 'ID', accessor: 'id', type: 'field', visible: true, sortable: true },
  { id: 'name', label: 'Name', accessor: 'name', type: 'field', visible: true, sortable: true },
  { id: 'label', label: 'Label', accessor: 'label', type: 'field', visible: true, sortable: true },
  {
    id: 'attributeType',
    label: 'Type',
    accessor: 'attributeType',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'isRequired',
    label: 'Required',
    accessor: 'isRequired',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'sortOrder',
    label: 'Sort Order',
    accessor: 'sortOrder',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'systemConfig',
    label: 'System Config',
    accessor: 'systemConfig',
    type: 'relationship',
    visible: true,
    sortable: false,
  },
  { id: 'status', label: 'Status', accessor: 'status', type: 'field', visible: true, sortable: true },
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

const COLUMN_VISIBILITY_KEY = 'system-config-attribute-table-columns';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigAttributeTable() {
  const queryClient = useQueryClient();

  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [archiveTarget, setArchiveTarget] = useState<SystemConfigAttributeDTO | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (saved) {
        setColumnVisibility(JSON.parse(saved));
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

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => columnVisibility[col.id] !== false),
    [columnVisibility]
  );

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination();
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    resetPagination();
  };

  const getStatusForQuery = (statusTab: string) => {
    const statusMap: Record<string, SystemConfigAttributeDTOStatus> = {
      active: SystemConfigAttributeDTOStatus.ACTIVE,
      inactive: SystemConfigAttributeDTOStatus.INACTIVE,
      archived: SystemConfigAttributeDTOStatus.ARCHIVED,
    };
    return statusMap[statusTab] || SystemConfigAttributeDTOStatus.ACTIVE;
  };

  const currentStatus = getStatusForQuery(activeStatusTab);

  const { data: systemConfigOptions = [] } = useGetAllSystemConfigs(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const findEntityIdByName = (entities: any[], name: string, displayField: string) => {
    const entity = entities?.find((e) =>
      String(e?.[displayField] || '')
        .toLowerCase()
        .includes(name.toLowerCase())
    );
    return entity?.id;
  };

  const buildFilterParams = () => {
    const params: Record<string, any> =
      activeStatusTab === 'all'
        ? {}
        : {
            'status.equals': currentStatus,
          };

    if (searchTerm.trim()) {
      params['name.contains'] = searchTerm.trim();
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) return;

      if (key === 'id' || key === 'sortOrder') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          params[`${key}.equals`] = parsed;
        }
        return;
      }

      if (key === 'isRequired') {
        const normalized = String(value).trim().toLowerCase();
        if (['yes', 'true', '1'].includes(normalized)) {
          params['isRequired.equals'] = true;
        } else if (['no', 'false', '0'].includes(normalized)) {
          params['isRequired.equals'] = false;
        }
        return;
      }

      if (key === 'createdDate' || key === 'lastModifiedDate') {
        params[`${key}.equals`] = value;
        return;
      }

      if (key === 'systemConfig.configKey') {
        const configId = findEntityIdByName(systemConfigOptions, String(value), 'configKey');
        if (configId) {
          params['systemConfigId.equals'] = configId;
        }
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

  const { data, isLoading, error } = useGetAllSystemConfigAttributes({
    page: apiPage,
    size: pageSize,
    sort: ['id,asc'],
    ...filterParams,
  });

  const { data: countData } = useCountSystemConfigAttributes(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const updateMutation = useUpdateSystemConfigAttribute();

  const invalidateListQuery = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === '/api/system-config-attributes' ||
        query.queryKey[0] === '/api/system-config-attributes/count',
    });
  };

  const updateStatus = async (attribute: SystemConfigAttributeDTO, status: SystemConfigAttributeDTOStatus) => {
    if (!attribute.id) return;

    try {
      await updateMutation.mutateAsync({
        id: attribute.id,
        data: { ...attribute, id: attribute.id, status },
      });

      if (status === SystemConfigAttributeDTOStatus.ACTIVE) {
        toast.success('Attribute activated successfully');
      } else if (status === SystemConfigAttributeDTOStatus.INACTIVE) {
        toast.success('Attribute deactivated successfully');
      } else {
        toast.success('Attribute archived successfully');
      }

      await invalidateListQuery();
    } catch (error) {
      toast.error('Failed to update attribute status');
      console.error(error);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;

    await updateStatus(archiveTarget, SystemConfigAttributeDTOStatus.ARCHIVED);
    setShowArchiveDialog(false);
    setArchiveTarget(null);
  };

  const totalItems = countData || 0;
  const hasActiveFilters = Object.keys(filters).length > 0 || Boolean(searchTerm);

  if (!isColumnVisibilityLoaded) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-muted-foreground">Loading table configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading attributes. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Status Tabs */}
        <Tabs
          value={activeStatusTab}
          onValueChange={(value) => {
            setActiveStatusTab(value);
            resetPagination();
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table Controls */}
        <div className="table-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 h-9"
              />
            </div>

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
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gray-50">
                  {visibleColumns.map((column) => (
                    <TableHead key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px] sm:w-[120px] sticky right-0 bg-gray-50 px-2 sm:px-3 py-2 border-l border-gray-200 z-10">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 font-medium text-gray-700 text-xs sm:text-sm">
                      <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                      <span className="hidden sm:inline">Actions</span>
                    </div>
                  </TableHead>
                </TableRow>

                <TableRow className="border-b bg-white">
                  {visibleColumns.map((column) => (
                    <TableHead key={`filter-${column.id}`} className="px-2 sm:px-3 py-2">
                      {column.type === 'field'
                        ? (() => {
                            if (column.accessor === 'createdDate' || column.accessor === 'lastModifiedDate') {
                              return (
                                <Input
                                  type="date"
                                  className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  value={(filters[column.accessor] as string) || ''}
                                  onChange={(e) =>
                                    handleFilterChange(column.accessor, e.target.value || undefined)
                                  }
                                />
                              );
                            }

                            if (column.accessor === 'id' || column.accessor === 'sortOrder') {
                              return (
                                <Input
                                  type="number"
                                  placeholder="Filter..."
                                  className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                                  value={(filters[column.accessor] as string) || ''}
                                  onChange={(e) =>
                                    handleFilterChange(column.accessor, e.target.value || undefined)
                                  }
                                />
                              );
                            }

                            return (
                              <Input
                                placeholder="Filter..."
                                className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                                value={(filters[column.accessor] as string) || ''}
                                onChange={(e) =>
                                  handleFilterChange(column.accessor, e.target.value || undefined)
                                }
                              />
                            );
                          })()
                        : column.id === 'systemConfig'
                          ? (
                              <Input
                                placeholder="Filter..."
                                className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                                value={(filters['systemConfig.configKey'] as string) || ''}
                                onChange={(e) =>
                                  handleFilterChange('systemConfig.configKey', e.target.value || undefined)
                                }
                              />
                            )
                          : null}
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px] sm:w-[120px] sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10">
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                      <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600 hidden sm:inline">
                        Filters
                      </span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.map((column) => {
                        const value = item[column.accessor as keyof SystemConfigAttributeDTO];

                        if (column.id === 'systemConfig') {
                          return (
                            <TableCell key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              {item.systemConfig?.configKey || '-'}
                            </TableCell>
                          );
                        }

                        if (column.accessor === 'attributeType' || column.accessor === 'status') {
                          return (
                            <TableCell key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              {transformEnumValue(String(value || ''))}
                            </TableCell>
                          );
                        }

                        if (column.accessor === 'isRequired') {
                          return (
                            <TableCell key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                              {item.isRequired ? 'Yes' : 'No'}
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                            {(value as any) ?? '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <InlinePermissionGuard requiredPermission="systemConfigAttribute:read">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            >
                              <Link href={`/system-config-attributes/${item.id}`}>
                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                          </InlinePermissionGuard>

                          <InlinePermissionGuard requiredPermission="systemConfigAttribute:update">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            >
                              <Link href={`/system-config-attributes/${item.id}/edit`}>
                                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </InlinePermissionGuard>

                          <InlinePermissionGuard requiredPermission="systemConfigAttribute:update">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                  disabled={updateMutation.isPending}
                                >
                                  <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span className="sr-only">Status Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.status !== SystemConfigAttributeDTOStatus.ACTIVE && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus(item, SystemConfigAttributeDTOStatus.ACTIVE)
                                    }
                                    className="text-green-700"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Set Active
                                  </DropdownMenuItem>
                                )}
                                {item.status !== SystemConfigAttributeDTOStatus.INACTIVE && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus(item, SystemConfigAttributeDTOStatus.INACTIVE)
                                    }
                                    className="text-yellow-700"
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Set Inactive
                                  </DropdownMenuItem>
                                )}
                                {item.status !== SystemConfigAttributeDTOStatus.ARCHIVED && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (!item.id) return;
                                        setArchiveTarget(item);
                                        setShowArchiveDialog(true);
                                      }}
                                      className="text-red-700"
                                    >
                                      <Archive className="w-4 h-4 mr-2" />
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
            <AlertDialogTitle>Archive Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this attribute? This action can be reversed by
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
