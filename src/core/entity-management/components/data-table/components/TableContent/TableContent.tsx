import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { TableColumnHeaders } from './TableColumnHeaders';
import { TableRows } from './TableRows';
import { TableEmptyState } from './TableEmptyState';
import { useTableContext } from '../../context/TableContext';

export interface TableContentProps {
  className?: string;
}

export const TableContent: React.FC<TableContentProps> = ({ className }) => {
  const { table, isLoading, data } = useTableContext();

  const hasRows = table.getRowModel().rows?.length > 0;

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-auto">
      {/* Responsive table with horizontal scrolling on mobile */}
      <div className="w-full overflow-auto">
        <Table>
          <TableColumnHeaders />
          <TableBody>
            {hasRows ? (
              <TableRows />
            ) : (
              <TableEmptyState />
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile-friendly indicator when table is scrollable */}
      <div className="md:hidden text-xs text-center text-gray-500 dark:text-gray-400 py-1 border-t border-gray-200 dark:border-gray-800">
        {hasRows && data && data.length > 0 && (
          <span>Swipe to see more columns →</span>
        )}
      </div>
    </div>
  );
};
