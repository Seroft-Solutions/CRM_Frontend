'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
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
  useCountSystemConfigAttributes,
  useGetAllSystemConfigAttributes,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
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

export function SystemConfigAttributeTable() {
  const queryClient = useQueryClient();

  const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [archiveTarget, setArchiveTarget] = useState<SystemConfigAttributeDTO | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const getStatusForQuery = (statusTab: string) => {
    const statusMap: Record<string, SystemConfigAttributeDTOStatus> = {
      active: SystemConfigAttributeDTOStatus.ACTIVE,
      inactive: SystemConfigAttributeDTOStatus.INACTIVE,
      archived: SystemConfigAttributeDTOStatus.ARCHIVED,
    };
    return statusMap[statusTab] || SystemConfigAttributeDTOStatus.ACTIVE;
  };

  const currentStatus = getStatusForQuery(activeStatusTab);

  const filterParams =
    activeStatusTab === 'all'
      ? {}
      : {
          'status.equals': currentStatus,
        };

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
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Name</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Label</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Type</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Required</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">Sort Order</TableHead>
                  <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    System Config
                  </TableHead>
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
                    <TableCell colSpan={9} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{transformEnumValue(item.attributeType)}</TableCell>
                      <TableCell>{item.isRequired ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>{item.systemConfig?.configKey || '-'}</TableCell>
                      <TableCell>{transformEnumValue(item.status)}</TableCell>
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
                    <TableCell colSpan={9} className="h-24 text-center">
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
