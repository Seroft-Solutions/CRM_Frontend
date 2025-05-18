import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTableContext } from '../../context/TableContext';

export interface TablePaginationProps {
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({ className }) => {
  const { 
    table, 
    isServerSide, 
    totalItems,
    defaultPageSize,
    enableMultiSelect,
    onPageSizeChange
  } = useTableContext();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky bottom-0 p-4 shadow-sm rounded-b-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-700 dark:text-gray-300">{table.getFilteredRowModel().rows.length}</span> of <span className="font-medium text-gray-700 dark:text-gray-300">{totalItems || table.getCoreRowModel().rows.length}</span> items
          </p>
          {enableMultiSelect && (
            <div className="ml-2 flex items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 mr-1">Selected:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {table.getFilteredSelectedRowModel().rows.length}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex w-auto items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="hidden md:inline mr-1">Items per page:</span>
            <span className="md:hidden mr-1">Per page:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => {
                const size = Number(value);
                table.setPageSize(size);
                if (isServerSide && onPageSizeChange) {
                  onPageSizeChange(size);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[60px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                <SelectValue placeholder={defaultPageSize}/>
              </SelectTrigger>
              <SelectContent side="top" className="max-h-[300px] overflow-y-auto p-1">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-auto items-center justify-center text-sm text-gray-500 dark:text-gray-400 mx-2">
            Page <span className="font-medium text-gray-700 dark:text-gray-300 mx-1">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-medium text-gray-700 dark:text-gray-300 mx-1">
              {isServerSide ? 
                Math.max(1, Math.ceil((totalItems || 0) / table.getState().pagination.pageSize)) : 
                Math.max(1, table.getPageCount())}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4"/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4"/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4"/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
