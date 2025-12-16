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
import { Archive, Eye, EyeOff, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

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

  const filterParams = {
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
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Attribute</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>{item.attribute?.name || '-'}</TableCell>
                    <TableCell>{transformEnumValue(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/system-config-attribute-options/${item.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/system-config-attribute-options/${item.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {item.status !== SystemConfigAttributeOptionDTOStatus.ACTIVE && (
                            <DropdownMenuItem
                              disabled={updateMutation.isPending}
                              onClick={() => updateStatus(item, SystemConfigAttributeOptionDTOStatus.ACTIVE)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Mark Active
                            </DropdownMenuItem>
                          )}
                          {item.status !== SystemConfigAttributeOptionDTOStatus.INACTIVE && (
                            <DropdownMenuItem
                              disabled={updateMutation.isPending}
                              onClick={() => updateStatus(item, SystemConfigAttributeOptionDTOStatus.INACTIVE)}
                            >
                              <EyeOff className="mr-2 h-4 w-4" />
                              Mark Inactive
                            </DropdownMenuItem>
                          )}
                          {item.status !== SystemConfigAttributeOptionDTOStatus.ARCHIVED && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (!item.id) return;
                                setArchiveTarget(item);
                                setShowArchiveDialog(true);
                              }}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
