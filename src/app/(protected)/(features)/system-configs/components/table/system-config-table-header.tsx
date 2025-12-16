'use client';

import { ChevronDown, ChevronsUpDown, ChevronUp, Filter } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

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
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
}

export function SystemConfigTableHeader({
  columns,
  sort,
  order,
  onSort,
  filters,
  onFilterChange,
}: SystemConfigTableHeaderProps) {
  const getSortIcon = (column: string) => {
    if (sort !== column) {
      return 'ChevronsUpDown';
    }
    return order === 'asc' ? 'ChevronUp' : 'ChevronDown';
  };

  const renderSortIcon = (column: string) => {
    const iconType = getSortIcon(column);
    switch (iconType) {
      case 'ChevronUp':
        return <ChevronUp className="h-4 w-4" />;
      case 'ChevronDown':
        return <ChevronDown className="h-4 w-4" />;
      default:
        return <ChevronsUpDown className="h-4 w-4" />;
    }
  };

  return (
    <TableHeader>
      {/* Header Row with Sort Buttons */}
      <TableRow className="border-b border-gray-200 bg-gray-50">
        {columns.map((column) => (
          <TableHead key={column.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
            {column.sortable ? (
              <Button
                variant="ghost"
                onClick={() => onSort(column.accessor)}
                className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
              >
                {column.label}
                <div className="text-gray-400">{renderSortIcon(column.accessor)}</div>
              </Button>
            ) : (
              <span className="font-medium text-gray-700 text-sm">{column.label}</span>
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

      {/* Filter Row */}
      <TableRow className="border-b bg-white">
        {columns.map((column) => (
          <TableHead key={`filter-${column.id}`} className="px-2 sm:px-3 py-2">
            {column.type === 'field'
              ? (() => {
                  if (column.accessor === 'createdDate' || column.accessor === 'lastModifiedDate') {
                    return (
                      <Input
                        type="date"
                        className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={(filters[column.accessor] as string) || ''}
                        onChange={(e) =>
                          onFilterChange(column.accessor, e.target.value || undefined)
                        }
                      />
                    );
                  }

                  if (column.accessor === 'id') {
                    return (
                      <Input
                        type="number"
                        placeholder="Filter..."
                        className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                        value={(filters[column.accessor] as string) || ''}
                        onChange={(e) =>
                          onFilterChange(column.accessor, e.target.value || undefined)
                        }
                      />
                    );
                  }

                  return (
                    <Input
                      placeholder="Filter..."
                      className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                      value={(filters[column.accessor] as string) || ''}
                      onChange={(e) => onFilterChange(column.accessor, e.target.value || undefined)}
                    />
                  );
                })()
              : null}
          </TableHead>
        ))}
        <TableHead className="w-[100px] sm:w-[120px] sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
            <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 hidden sm:inline">Filters</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
