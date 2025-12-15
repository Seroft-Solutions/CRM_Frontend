'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDown, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ProductSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function ProductSearchAndFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  hasActiveFilters,
}: ProductSearchAndFiltersProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const activeFiltersCount =
    Object.values(filters).filter((v) => v !== undefined && v !== '').length +
    (searchTerm ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFilterChange(filterKey, undefined);
  };

  const getFilterDisplayValue = (key: string, value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return format(value, 'MMM dd, yyyy');
    return String(value);
  };

  const getFilterDisplayName = (key: string) => {
    if (key.includes('.')) {
      const [relationName] = key.split('.');
      if (relationName === 'category') {
        return 'Category';
      }
      if (relationName === 'subCategory') {
        return 'Sub Category';
      }
      return relationName;
    }

    if (key === 'createdDate') {
      return 'createdDate';
    }
    if (key === 'lastModifiedDate') {
      return 'lastModifiedDate';
    }
    if (key === 'name') {
      return 'name';
    }
    if (key === 'code') {
      return 'code';
    }
    if (key === 'description') {
      return 'description';
    }
    if (key === 'basePrice') {
      return 'basePrice';
    }
    if (key === 'discountedPrice') {
      return 'discountedPrice';
    }
    if (key === 'salePrice') {
      return 'salePrice';
    }
    if (key === 'articleNumber') {
      return 'articleNumber';
    }
    if (key === 'remark') {
      return 'remark';
    }
    if (key === 'status') {
      return 'status';
    }
    if (key === 'createdBy') {
      return 'createdBy';
    }
    if (key === 'lastModifiedBy') {
      return 'lastModifiedBy';
    }
    return key;
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={onSearchChange}
            className="pl-10"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu open={showFilterDropdown} onOpenChange={setShowFilterDropdown}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <DropdownMenuSeparator />

              {/* People Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">
                  People & Relationships
                </DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Input
                      placeholder="Filter by category..."
                      value={(filters['category.name'] as string) || ''}
                      onChange={(e) => onFilterChange('category.name', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Sub Category</label>
                    <Input
                      placeholder="Filter by sub category..."
                      value={(filters['subCategory.name'] as string) || ''}
                      onChange={(e) =>
                        onFilterChange('subCategory.name', e.target.value || undefined)
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Dates Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">Dates</DropdownMenuLabel>
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    createdDate Range
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-8 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                            </>
                          ) : (
                            format(dateRange.from, 'MMM dd, yyyy')
                          )
                        ) : (
                          'Pick date range'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) =>
                          onDateRangeChange({ from: range?.from, to: range?.to })
                        }
                        numberOfMonths={2}
                      />
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7"
                          onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                        >
                          Clear Date Range
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Other Fields Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">
                  Other Fields
                </DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">name</label>
                    <Input
                      placeholder="Filter by name..."
                      value={(filters['name'] as string) || ''}
                      onChange={(e) => onFilterChange('name', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">code</label>
                    <Input
                      placeholder="Filter by code..."
                      value={(filters['code'] as string) || ''}
                      onChange={(e) => onFilterChange('code', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">description</label>
                    <Input
                      placeholder="Filter by description..."
                      value={(filters['description'] as string) || ''}
                      onChange={(e) => onFilterChange('description', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button
                onClick={() => onSearchChange({ target: { value: '' } } as any)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {Object.entries(filters).map(
            ([key, value]) =>
              value !== undefined &&
              value !== '' && (
                <Badge key={key} variant="secondary" className="gap-1">
                  {getFilterDisplayName(key)}: {getFilterDisplayValue(key, value)}
                  <button
                    onClick={() => removeFilter(key)}
                    className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
          )}

          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {dateRange.from && format(dateRange.from, 'MMM dd')}
              {dateRange.from && dateRange.to && ' - '}
              {dateRange.to && format(dateRange.to, 'MMM dd')}
              <button
                onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
