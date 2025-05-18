import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Loader2, Search, UserRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTableContext } from '../../context/TableContext';

export interface TableEmptyStateProps {
  className?: string;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({ className }) => {
  const { isLoading, table } = useTableContext();
  
  // Get the column count for colSpan
  const columnCount = table.getAllColumns().length;

  if (isLoading) {
    return (
      <TableRow>
        <TableCell
          colSpan={columnCount}
          className="h-72 text-center"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-gray-500 mt-4 block">
              Loading data...
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Get table props to check if this is the users table
  const { error, onAdd } = useTableContext();
  
  // If there's an error, show error state
  if (error) {
    return (
      <TableRow>
        <TableCell
          colSpan={columnCount}
          className="h-72 text-center"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <span className="text-base font-medium text-gray-700 dark:text-gray-300 mt-4 block">
              Error loading data
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {error.message || 'Something went wrong. Please try again.'}
            </span>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
  
  // Empty state when no data is available
  return (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        className="h-72 text-center"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
            <UserRound className="h-6 w-6 text-gray-400" />
          </div>
          <span className="text-base font-medium text-gray-700 dark:text-gray-300 mt-4 block">
            No results found
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
            Try adjusting your search or filter to find what you're looking for, or add a new user using the button below.
          </span>
          {onAdd && (
            <Button onClick={() => onAdd()}>
              Add New
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
