import React from 'react';
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTableContext } from '../../context/TableContext';

export interface TableColumnHeadersProps {
  className?: string;
}

export const TableColumnHeaders: React.FC<TableColumnHeadersProps> = ({ className }) => {
  const { table, renderHeaderCell } = useTableContext();

  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="bg-gray-100/80 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700">
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className={cn(
                "h-11 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider",
                header.column.id === "actions" && "text-right pr-6 w-[120px]",
                header.column.id === "select" && "w-[50px]"
              )}
            >
              {renderHeaderCell(header)}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
};
