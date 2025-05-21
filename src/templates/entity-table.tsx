'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

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

// This is a generic entity table template
// It should be customized for each entity type

interface EntityTableProps<T> {
  // Data and loading state
  data: T[];
  isLoading: boolean;
  
  // Sorting
  sort: string;
  order: string;
  onSort: (column: string) => void;
  
  // Entity metadata
  entityName: string;
  basePath: string;
  
  // Column definitions
  columns: Array<{
    accessorKey: string;
    header: string;
    cell?: (value: any) => React.ReactNode;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relationship';
    relationshipDisplayField?: string;
  }>;
  
  // Delete mutation
  useDeleteEntity: any;
  
  // Optional callbacks
  onDelete?: (id: number | string) => void;
  onRowClick?: (row: T) => void;
}

export default function EntityTable<T extends { id?: number | string }>({
  data,
  isLoading,
  sort,
  order,
  onSort,
  entityName,
  basePath,
  columns,
  useDeleteEntity,
  onDelete,
  onRowClick
}: EntityTableProps<T>) {
  const router = useRouter();
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // State for table features
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Delete mutation
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteEntity({
    mutation: {
      onSuccess: () => {
        toast.success(`${entityName} deleted successfully`);
        router.refresh();
        
        if (onDelete && itemToDelete?.id) {
          onDelete(itemToDelete.id);
        }
      },
      onError: (error: any) => {
        toast.error(`Error deleting ${entityName}: ${error?.message || 'Unknown error'}`);
        console.error(error);
      }
    }
  });
  
  // Handle delete confirmation
  const confirmDelete = (item: T) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };
  
  // Execute delete
  const executeDelete = () => {
    if (itemToDelete?.id) {
      deleteItem({ id: itemToDelete.id });
      setConfirmDialogOpen(false);
    }
  };
  
  // Format cell value based on type
  const formatCellValue = (value: any, type: string) => {
    if (value === null || value === undefined) {
      return '--';
    }
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };
  
  // Get value from relationship
  const getRelationshipValue = (row: T, field: string, displayField: string) => {
    const relationship = (row as any)[field];
    if (!relationship) {
      return '--';
    }
    
    if (Array.isArray(relationship)) {
      return relationship.map(item => item[displayField] || `ID: ${item.id}`).join(', ');
    }
    
    return relationship[displayField] || `ID: ${relationship.id}`;
  };
  
  // Build table columns
  const tableColumns: ColumnDef<T>[] = [
    // Selection column
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
    
    // Data columns
    ...columns.map(column => ({
      accessorKey: column.accessorKey,
      header: ({ column: tableColumn }) => {
        const isCurrentSort = sort === column.accessorKey;
        
        return (
          <Button
            variant="ghost"
            onClick={() => onSort(column.accessorKey)}
            className="hover:bg-transparent"
          >
            {column.header}
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
        if (column.cell) {
          return column.cell(row.original);
        }
        
        if (column.type === 'relationship' && column.relationshipDisplayField) {
          const value = getRelationshipValue(
            row.original, 
            column.accessorKey, 
            column.relationshipDisplayField
          );
          
          return isLoading ? (
            <Skeleton className="h-4 w-[100px]" />
          ) : (
            <div className="line-clamp-1">{value}</div>
          );
        }
        
        const value = row.getValue(column.accessorKey);
        
        return isLoading ? (
          <Skeleton className="h-4 w-[100px]" />
        ) : (
          <div className="line-clamp-1">
            {formatCellValue(value, column.type || 'string')}
          </div>
        );
      },
    })),
    
    // Actions column
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
                disabled={isLoading || isDeleting}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/${item.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/${item.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => confirmDelete(item)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  // Initialize table
  const table = useReactTable({
    data,
    columns: tableColumns,
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
          placeholder={`Filter ${entityName}s...`}
          value={(table.getColumn(columns[0].accessorKey)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(columns[0].accessorKey)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
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
                    colSpan={tableColumns.length}
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
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={onRowClick ? "cursor-pointer" : ""}
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={confirmDialogOpen} 
        onOpenChange={setConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {entityName.toLowerCase()}
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
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
