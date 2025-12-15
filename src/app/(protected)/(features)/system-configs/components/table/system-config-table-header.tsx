'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
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
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.id}>
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
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
