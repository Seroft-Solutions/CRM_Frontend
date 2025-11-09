'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Edit2,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import {
  useCreateCallRemark,
  useDeleteCallRemark,
  useGetAllCallRemarks,
  useUpdateCallRemark,
} from '@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen';
import type { CallRemarkDTO } from '@/core/api/generated/spring/schemas/CallRemarkDTO';

interface CallRemarksSectionProps {
  callId: number;
}

export function CallRemarksSection({ callId }: CallRemarksSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<CallRemarkDTO | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [editRemark, setEditRemark] = useState('');

  const [sorting, setSorting] = useState<SortingState>([{ id: 'dateTime', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const {
    data: callRemarks = [],
    isLoading,
    refetch,
  } = useGetAllCallRemarks(
    {
      'callId.equals': callId,
      sort: ['dateTime,desc'],
    },
    {
      query: {
        enabled: !!callId,
      },
    }
  );

  const { mutate: createCallRemark, isPending: isCreating } = useCreateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success('Call remark added successfully');
        setShowAddDialog(false);
        setNewRemark('');
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to add call remark: ${error}`);
      },
    },
  });

  const { mutate: updateCallRemark, isPending: isUpdating } = useUpdateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success('Call remark updated successfully');
        setShowEditDialog(false);
        setSelectedRemark(null);
        setEditRemark('');
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to update call remark: ${error}`);
      },
    },
  });

  const { mutate: deleteCallRemark, isPending: isDeleting } = useDeleteCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success('Call remark deleted successfully');
        setShowDeleteDialog(false);
        setSelectedRemark(null);
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to delete call remark: ${error}`);
      },
    },
  });

  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      toast.error('Please enter a remark');
      return;
    }

    createCallRemark({
      data: {
        remark: newRemark,
        dateTime: new Date(),
        call: { id: callId },
        status: 'ACTIVE',
      },
    });
  };

  const handleEditRemark = () => {
    if (!selectedRemark || !editRemark.trim()) {
      toast.error('Please enter a remark');
      return;
    }

    updateCallRemark({
      id: selectedRemark.id!,
      data: {
        ...selectedRemark,
        remark: editRemark,
      },
    });
  };

  const handleDeleteRemark = () => {
    if (selectedRemark?.id) {
      deleteCallRemark({ id: selectedRemark.id });
    }
  };

  const openEditDialog = (remark: CallRemarkDTO) => {
    setSelectedRemark(remark);
    setEditRemark(remark.remark || '');
    setShowEditDialog(true);
  };

  const openDeleteDialog = (remark: CallRemarkDTO) => {
    setSelectedRemark(remark);
    setShowDeleteDialog(true);
  };

  const columns = useMemo<ColumnDef<CallRemarkDTO>[]>(
    () => [
      {
        accessorKey: 'dateTime',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3 text-xs"
            >
              Date & Time
              {column.getIsSorted() === 'asc' ? (
                <SortAsc className="ml-2 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <SortDesc className="ml-2 h-3 w-3" />
              ) : (
                <Filter className="ml-2 h-3 w-3 opacity-50" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const dateTime = row.getValue('dateTime') as string;
          if (!dateTime) return <span className="text-muted-foreground text-xs">No date</span>;

          const date = new Date(dateTime);
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-foreground">
                {format(date, 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">{format(date, 'h:mm a')}</div>
            </div>
          );
        },
        size: 90,
        minSize: 90,
        maxSize: 90,
      },
      {
        accessorKey: 'remark',
        header: 'Remark Content',
        cell: ({ row }) => {
          const remark = row.getValue('remark') as string;
          const truncatedRemark = remark?.length > 100 ? `${remark.substring(0, 100)}...` : remark;

          return (
            <div className="w-full">
              <div
                className="text-sm whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-lg border-l-2 border-primary/20"
                title={remark}
              >
                {truncatedRemark || 'No content'}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: ({ column }) => {
          return <div className="text-right">Actions</div>;
        },
        cell: ({ row }) => {
          const remark = row.original;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={() => openEditDialog(remark)}
                    className="cursor-pointer"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Remark
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(remark)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Remark
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 60,
        minSize: 60,
        maxSize: 60,
      },
    ],
    []
  );

  const table = useReactTable({
    data: callRemarks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: false,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">Call Remarks</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {callRemarks.length}
              </Badge>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Remark
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search remarks..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} of {callRemarks.length} remarks
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading remarks...</div>
            </div>
          ) : callRemarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No remarks yet</div>
              <div className="text-xs text-muted-foreground">
                Add the first remark to start tracking call history
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Data Table */}
              <div className="rounded-md border">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} style={{ width: header.getSize() }}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-6 w-6 text-muted-foreground" />
                            <span className="text-muted-foreground">No remarks found.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => {
                        table.setPageSize(Number(e.target.value));
                      }}
                      className="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
                    >
                      {[5, 10, 20, 30].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-6 lg:gap-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <span className="sr-only">Go to previous page</span>←
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <span className="sr-only">Go to next page</span>→
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Remark Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Call Remark</DialogTitle>
            <DialogDescription>
              Add a new remark to track important information about this call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-remark">Remark</Label>
              <Textarea
                id="new-remark"
                placeholder="Enter your remark here..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewRemark('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRemark} disabled={isCreating || !newRemark.trim()}>
              {isCreating ? 'Adding...' : 'Add Remark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Remark Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Call Remark</DialogTitle>
            <DialogDescription>Update the remark content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-remark">Remark</Label>
              <Textarea
                id="edit-remark"
                placeholder="Enter your remark here..."
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedRemark(null);
                setEditRemark('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditRemark} disabled={isUpdating || !editRemark.trim()}>
              {isUpdating ? 'Updating...' : 'Update Remark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Remark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this remark? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedRemark(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRemark}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
