import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { flexRender } from "@tanstack/react-table";
import { useTableContext } from '../../context/TableContext';

export interface TableRowsProps {
  className?: string;
}

export const TableRows: React.FC<TableRowsProps> = ({ className }) => {
  const { 
    table, 
    enableRowClick, 
    handleRowClick
  } = useTableContext();

  return (
    <>
      {table.getRowModel().rows.map((row, index) => (
        <TableRow
          key={row.id}
          className={cn(
            "h-12 transition-colors",
            index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900",
            enableRowClick && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
            !enableRowClick && "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          data-state={row.getIsSelected() && "selected"}
          onClick={(e) => handleRowClick(e, row)}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            >
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext()
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
