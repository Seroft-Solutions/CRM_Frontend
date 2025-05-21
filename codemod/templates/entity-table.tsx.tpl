'use client';

// React and Next.js imports
import React from 'react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Table imports
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState
} from '@tanstack/react-table';

// API and types
import { [[dto]] } from '@/core/api/generated/schemas';
import { [[hooks.del]] } from '[[endpointImport]]';

// UI Components
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableRow, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  MoreHorizontal,
  ArrowUpDown,
  Pencil,
  Eye,
  Trash,
  ArrowUp,
  ArrowDown,
  Settings2
} from 'lucide-react';

interface Props {
  data: [[dto]][];
  isLoading: boolean;
  sort: string;
  order: string;
  onSort: (col: string) => void;
}

export function [[entity]]Table({ data, isLoading, sort, order, onSort }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [itemToDelete, setItemToDelete] = useState<[[dto]] | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Delete mutation
  const { mutate: deleteItem, isPending: isDeleting } = [[hooks.del]]({
    mutation: {
      onSuccess: () => {
        toast.success('[[entity]] deleted successfully');
        router.refresh();
      },
      onError: (error) => {
        toast.error('Error deleting [[entity]]');
        console.error(error);
      }
    }
  });

  // Delete selected items
  const deleteSelected = () => {
    const selectedIds = Object.keys(rowSelection).map(idx => data[parseInt(idx)].id);
    startTransition(() => {
      Promise.all(selectedIds.map(id => deleteItem({ id })))
        .then(() => {
          setRowSelection({});
          router.refresh();
        });
    });
  };

  // Format cells based on data type
  const formatCellValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined) return '--';
    
    if (fieldType === 'date') {
      return new Date(value).toLocaleString();
    }
    
    if (fieldType === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  // Handle relationship field display
  const getRelationshipValue = (row: [[dto]], relationshipField: string, displayField: string) => {
    const relationship = row[relationshipField as keyof [[dto]]];
    if (!relationship) return '--';
    
    // Handle both direct objects and array relationships
    if (Array.isArray(relationship)) {
      return relationship.map(item => item[displayField as keyof typeof item]).join(', ');
    }
    
    return relationship[displayField as keyof typeof relationship] || '--';
  };

  // Table columns configuration
  const columns = React.useMemo<ColumnDef<[[dto]]>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
[[#fields]]
    {
      accessorKey: '[[name]]',
      header: ({ column }) => {
        const isCurrentSort = sort === '[[name]]';
        return (
          <Button
            variant="ghost"
            onClick={() => onSort('[[name]]')}
            className="hover:bg-transparent"
          >
            [[label]]
            <span className="ml-2">
              {isCurrentSort ? (
                order === 'ASC' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-50" />
              )}
            </span>
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue('[[name]]');
        return isLoading ? (
          <Skeleton className="h-4 w-[100px]" />
        ) : (
          <div className="line-clamp-1">
            {formatCellValue(value, '[[type]]')}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.length === 0 ? true : value.includes(String(row.getValue(id)));
      },
    },
[[/fields]]
[[#relationships]]
    {
      id: '[[name]]',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => onSort('[[name]]Id')}
          className="hover:bg-transparent"
        >
          [[label]]
          <span className="ml-2">
            {sort === '[[name]]Id' ? (
              order === 'ASC' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </span>
        </Button>
      ),
      cell: ({ row }) => {
        const value = getRelationshipValue(row.original, '[[name]]', '[[displayField]]');
        return isLoading ? (
          <Skeleton className="h-4 w-[100px]" />
        ) : (
          <div className="line-clamp-1">{value}</div>
        );
      },
    },
[[/relationships]]
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                disabled={isLoading || isPending}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/[[kebab]]/${item.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/[[kebab]]/${item.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setItemToDelete(item)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ], [isLoading, isPending, onSort, sort, order]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Filter [[plural]]..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {Object.keys(rowSelection).length > 0 && (
          <Button
            variant="outline"
            onClick={deleteSelected}
            className="text-red-600"
          >
            Delete Selected
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        
        <div className={isLoading ? 'opacity-50' : ''}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : 
                        flexRender(header.column.columnDef.header, header.getContext())
                      }
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full" />
                        ))}
                      </div>
                    ) : (
                      "No items found."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow 
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog 
        open={!!itemToDelete} 
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete [[entity]]?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this [[entity]]
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  startTransition(() => {
                    deleteItem({ id: itemToDelete.id! });
                    setItemToDelete(null);
                  });
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
