'use client';

import { ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

interface SystemConfigTableHeaderProps {
  columns: ColumnConfig[];
  sort: string;
  order: string;
  onSort: (column: string) => void;
}

export function SystemConfigTableHeader({
  columns,
  sort,
  order,
  onSort,
}: SystemConfigTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="border-b border-gray-200 bg-gray-50">
        {columns.map((column) => (
          <TableHead key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
            {column.sortable ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => onSort(column.accessor)}
              >
                {column.label}
                {sort === column.accessor && (
                  <>
                    {order === 'asc' ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                  </>
                )}
              </Button>
            ) : (
              column.label
            )}
          </TableHead>
        ))}
        <TableHead className="w-[100px] sm:w-[120px] sticky right-0 bg-gray-50 px-2 sm:px-3 py-2 border-l border-gray-200 z-10">
          <div className="flex items-center justify-center gap-1 sm:gap-2 font-medium text-gray-700 text-xs sm:text-sm">
            <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
            <span className="hidden sm:inline">Actions</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
