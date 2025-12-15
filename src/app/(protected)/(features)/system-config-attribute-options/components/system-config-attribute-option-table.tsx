'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
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
  useGetAllSystemConfigAttributeOptions,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { Eye, Pencil, Archive, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const getStatusForQuery = (statusTab: string) => {
    const statusMap: Record<string, string> = {
      active: SystemConfigAttributeOptionDTOStatus.ACTIVE,
      inactive: SystemConfigAttributeOptionDTOStatus.INACTIVE,
      archived: SystemConfigAttributeOptionDTOStatus.ARCHIVED,
    };
    return statusMap[statusTab] || SystemConfigAttributeOptionDTOStatus.ACTIVE;
  };

  const currentStatus = getStatusForQuery(activeStatusTab);

  const { data, isLoading, error } = useGetAllSystemConfigAttributeOptions({
    page: page - 1,
    size: pageSize,
    sort: ['sortOrder,asc'],
    'status.equals': currentStatus,
  });

  const updateMutation = useUpdateSystemConfigAttributeOption();

  const handleArchive = async () => {
    if (!archiveId) return;

    const itemToArchive = data?.find((item) => item.id === archiveId);
    if (!itemToArchive) return;

    try {
      await updateMutation.mutateAsync({
        id: archiveId,
        data: { ...itemToArchive, status: SystemConfigAttributeOptionDTOStatus.ARCHIVED },
      });

      toast.success('Option archived successfully');
      setShowArchiveDialog(false);
      setArchiveId(null);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === '/api/system-config-attribute-options',
      });
    } catch (error) {
      toast.error('Failed to archive option');
      console.error(error);
    }
  };

  const totalPages = data ? Math.ceil(data.length / pageSize) : 0;

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

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>

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
                          <DropdownMenuItem onClick={() => item.id && setArchiveId(item.id) && setShowArchiveDialog(true)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
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
