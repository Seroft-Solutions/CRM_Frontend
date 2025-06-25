'use client';

import { ChevronDown, ChevronUp, ChevronsUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface CallTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function CallTableHeader({
  onSort,
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
}: CallTableHeaderProps) {
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
        <TableHead className="w-12 px-3 py-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
          />
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('callDateTime')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Call Date Time
            <div className="text-gray-400">{renderSortIcon('callDateTime')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('priority.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Priority
            <div className="text-gray-400">{renderSortIcon('priority.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('callType.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Call Type
            <div className="text-gray-400">{renderSortIcon('callType.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('subCallType.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Sub Call Type
            <div className="text-gray-400">{renderSortIcon('subCallType.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('callCategory.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Call Category
            <div className="text-gray-400">{renderSortIcon('callCategory.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('source.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Source
            <div className="text-gray-400">{renderSortIcon('source.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('customer.customerBusinessName')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Customer
            <div className="text-gray-400">{renderSortIcon('customer.customerBusinessName')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('channelType.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Channel Type
            <div className="text-gray-400">{renderSortIcon('channelType.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('channelParties.displayName')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Channel Parties
            <div className="text-gray-400">{renderSortIcon('channelParties.displayName')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('assignedTo.displayName')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Assigned To
            <div className="text-gray-400">{renderSortIcon('assignedTo.displayName')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('callStatus.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Call Status
            <div className="text-gray-400">{renderSortIcon('callStatus.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="w-[120px] sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
          <div className="flex items-center gap-2 font-medium text-gray-700 text-sm">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <span>Actions</span>
          </div>
        </TableHead>
      </TableRow>

      {/* Filter Row */}
      <TableRow className="border-b bg-white">
        <TableHead className="w-12 px-3 py-2">{/* Empty cell for checkbox column */}</TableHead>

        <TableHead className="px-3 py-2">
          <Input
            type="date"
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={(filters['callDateTime'] as string) || ''}
            onChange={(e) => onFilterChange('callDateTime', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['priority.name'] as string) || ''}
            onChange={(e) => onFilterChange('priority.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['callType.name'] as string) || ''}
            onChange={(e) => onFilterChange('callType.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['subCallType.name'] as string) || ''}
            onChange={(e) => onFilterChange('subCallType.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['callCategory.name'] as string) || ''}
            onChange={(e) => onFilterChange('callCategory.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['source.name'] as string) || ''}
            onChange={(e) => onFilterChange('source.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['customer.customerBusinessName'] as string) || ''}
            onChange={(e) =>
              onFilterChange('customer.customerBusinessName', e.target.value || undefined)
            }
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['channelType.name'] as string) || ''}
            onChange={(e) => onFilterChange('channelType.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['channelParties.displayName'] as string) || ''}
            onChange={(e) =>
              onFilterChange('channelParties.displayName', e.target.value || undefined)
            }
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['assignedTo.displayName'] as string) || ''}
            onChange={(e) => onFilterChange('assignedTo.displayName', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['callStatus.name'] as string) || ''}
            onChange={(e) => onFilterChange('callStatus.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="w-[120px] sticky right-0 bg-white px-3 py-2 border-l border-gray-200">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Filters</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
