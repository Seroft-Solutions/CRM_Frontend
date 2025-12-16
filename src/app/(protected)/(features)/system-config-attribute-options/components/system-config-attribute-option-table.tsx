'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTO';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
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
  useCountSystemConfigAttributeOptions,
  useGetAllSystemConfigAttributeOptions,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { AlertTriangle, Archive, Eye, Filter, MoreVertical, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';
import { InlinePermissionGuard } from '@/core/auth';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigAttributeOptionTable() {
  const queryClient = useQueryClient();

  const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [archiveTarget, setArchiveTarget] = useState<SystemConfigAttributeOptionDTO | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const getStatusForQuery = (statusTab: string) => {
    const statusMap: Record<string, SystemConfigAttributeOptionDTOStatus> = {
      active: SystemConfigAttributeOptionDTOStatus.ACTIVE,
      inactive: SystemConfigAttributeOptionDTOStatus.INACTIVE,
      archived: SystemConfigAttributeOptionDTOStatus.ARCHIVED,
    };
    return statusMap[statusTab] || SystemConfigAttributeOptionDTOStatus.ACTIVE;
  };

  const currentStatus = getStatusForQuery(activeStatusTab);

  const filterParams =
    activeStatusTab === 'all'
      ? {}
      : {
          'status.equals': currentStatus,
        };

  const apiPage = page - 1;

  const { data, isLoading, error } = useGetAllSystemConfigAttributeOptions({
    page: apiPage,
    size: pageSize,
    sort: ['sortOrder,asc'],
    ...filterParams,
  });

  const { data: countData } = useCountSystemConfigAttributeOptions(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const updateMutation = useUpdateSystemConfigAttributeOption();

  const invalidateListQuery = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === '/api/system-config-attribute-options' ||
        query.queryKey[0] === '/api/system-config-attribute-options/count',
    });
  };

  const updateStatus = async (option: SystemConfigAttributeOptionDTO, status: SystemConfigAttributeOptionDTOStatus) => {
    if (!option.id) return;

    try {
      await updateMutation.mutateAsync({
        id: option.id,
        data: { ...option, id: option.id, status },
      });

      if (status === SystemConfigAttributeOptionDTOStatus.ACTIVE) {
        toast.success('Option activated successfully');
      } else if (status === SystemConfigAttributeOptionDTOStatus.INACTIVE) {
        toast.success('Option deactivated successfully');
      } else {
        toast.success('Option archived successfully');
      }

      await invalidateListQuery();
    } catch (error) {
      toast.error('Failed to update option status');
      console.error(error);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;

    await updateStatus(archiveTarget, SystemConfigAttributeOptionDTOStatus.ARCHIVED);
    setShowArchiveDialog(false);
    setArchiveTarget(null);
  };

  const totalItems = countData || 0;

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading options. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Status Tabs */}
        <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full">
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

        {/* Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gray-50">
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">ID</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Code</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Label</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Sort Order</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Attribute</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-[100px] sm:w-[120px] sticky right-0 bg-gray-50 px-2 sm:px-3 py-2 border-l border-gray-200 z-10">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 font-medium text-gray-700 text-xs sm:text-sm">
                      <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                      <span className="hidden sm:inline">Actions</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>{item.attribute?.name || '-'}</TableCell>
                      <TableCell>{transformEnumValue(item.status)}</TableCell>
                      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:read">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            >
                              <Link href={`/system-config-attribute-options/${item.id}`}>
                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                          </InlinePermissionGuard>

                          <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:update">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            >
                              <Link href={`/system-config-attribute-options/${item.id}/edit`}>
                                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </InlinePermissionGuard>

                          <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:update">
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
                                {item.status !== SystemConfigAttributeOptionDTOStatus.ACTIVE && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus(item, SystemConfigAttributeOptionDTOStatus.ACTIVE)
                                    }
                                    className="text-green-700"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Set Active
                                  </DropdownMenuItem>
                                )}
                                {item.status !== SystemConfigAttributeOptionDTOStatus.INACTIVE && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatus(
                                        item,
                                        SystemConfigAttributeOptionDTOStatus.INACTIVE
                                      )
                                    }
                                    className="text-yellow-700"
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Set Inactive
                                  </DropdownMenuItem>
                                )}
                                {item.status !== SystemConfigAttributeOptionDTOStatus.ARCHIVED && (
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
                    <TableCell colSpan={7} className="h-24 text-center">
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
            <AlertDialogTitle>Archive Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this option? This action can be reversed by
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
