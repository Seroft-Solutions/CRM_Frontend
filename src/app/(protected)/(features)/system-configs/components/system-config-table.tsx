'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
  Settings2,
  X,
} from 'lucide-react';
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
  useGetAllSystemConfigs,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { SystemConfigTableHeader } from './table/system-config-table-header';
import { SystemConfigTableRow } from './table/system-config-table-row';

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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState(ASC);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

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

  const { data, isLoading, error, refetch } = useGetAllSystemConfigs({
    page: page - 1,
    size: pageSize,
    sort: [`${sort},${order}`],
    'status.equals': currentStatus,
  });

  const updateMutation = useUpdateSystemConfig();

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.length / pageSize) : 0;

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
          <TabsList className="grid w-full max-w-md grid-cols-4">
            {TABLE_CONFIG.showDraftTab && <TabsTrigger value="draft">Draft</TabsTrigger>}
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings2 className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id] !== false}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, [column.id]: value }))
                    }
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
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
