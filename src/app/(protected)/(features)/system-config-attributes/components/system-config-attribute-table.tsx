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

  const filterParams = {
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
                <TableHead>Name</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>System Config</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{transformEnumValue(item.attributeType)}</TableCell>
                    <TableCell>{item.isRequired ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>{item.systemConfig?.configKey || '-'}</TableCell>
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
                            <Link href={`/system-config-attributes/${item.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/system-config-attributes/${item.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {item.status !== SystemConfigAttributeDTOStatus.ACTIVE && (
                            <DropdownMenuItem
                              disabled={updateMutation.isPending}
                              onClick={() => updateStatus(item, SystemConfigAttributeDTOStatus.ACTIVE)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Mark Active
                            </DropdownMenuItem>
                          )}
                          {item.status !== SystemConfigAttributeDTOStatus.INACTIVE && (
                            <DropdownMenuItem
                              disabled={updateMutation.isPending}
                              onClick={() => updateStatus(item, SystemConfigAttributeDTOStatus.INACTIVE)}
                            >
                              <EyeOff className="mr-2 h-4 w-4" />
                              Mark Inactive
                            </DropdownMenuItem>
                          )}
                          {item.status !== SystemConfigAttributeDTOStatus.ARCHIVED && (
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
                  <TableCell colSpan={9} className="h-24 text-center">
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
