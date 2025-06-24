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

interface CustomerTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function CustomerTableHeader({
  onSort,
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
}: CustomerTableHeaderProps) {
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
            onClick={() => onSort('customerBusinessName')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Customer Business Name
            <div className="text-gray-400">{renderSortIcon('customerBusinessName')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('email')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Email
            <div className="text-gray-400">{renderSortIcon('email')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('mobile')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Mobile
            <div className="text-gray-400">{renderSortIcon('mobile')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('whatsApp')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Whats App
            <div className="text-gray-400">{renderSortIcon('whatsApp')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('contactPerson')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Contact Person
            <div className="text-gray-400">{renderSortIcon('contactPerson')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('state.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            State
            <div className="text-gray-400">{renderSortIcon('state.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('district.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            District
            <div className="text-gray-400">{renderSortIcon('district.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('city.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            City
            <div className="text-gray-400">{renderSortIcon('city.name')}</div>
          </Button>
        </TableHead>

        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort('area.name')}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Area
            <div className="text-gray-400">{renderSortIcon('area.name')}</div>
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
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['customerBusinessName'] as string) || ''}
            onChange={(e) => onFilterChange('customerBusinessName', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['email'] as string) || ''}
            onChange={(e) => onFilterChange('email', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['mobile'] as string) || ''}
            onChange={(e) => onFilterChange('mobile', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['whatsApp'] as string) || ''}
            onChange={(e) => onFilterChange('whatsApp', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['contactPerson'] as string) || ''}
            onChange={(e) => onFilterChange('contactPerson', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['state.name'] as string) || ''}
            onChange={(e) => onFilterChange('state.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['district.name'] as string) || ''}
            onChange={(e) => onFilterChange('district.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['city.name'] as string) || ''}
            onChange={(e) => onFilterChange('city.name', e.target.value || undefined)}
          />
        </TableHead>

        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={(filters['area.name'] as string) || ''}
            onChange={(e) => onFilterChange('area.name', e.target.value || undefined)}
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
