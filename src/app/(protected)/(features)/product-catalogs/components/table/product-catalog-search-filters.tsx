'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDown, Filter, Search } from 'lucide-react';
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

interface ProductCatalogSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function ProductCatalogSearchAndFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  hasActiveFilters,
}: ProductCatalogSearchAndFiltersProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const activeFiltersCount =
    Object.values(filters).filter((v) => v !== undefined && v !== '').length +
    (searchTerm ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  const getFilterDisplayValue = (key: string, value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return format(value, 'MMM dd, yyyy');
    return String(value);
  };

  const getFilterDisplayName = (key: string) => {
    if (key === 'createdDate') {
      return 'createdDate';
    }
    if (key === 'productCatalogName') {
      return 'productCatalogName';
    }
    if (key === 'price') {
      return 'price';
    }
    if (key === 'description') {
      return 'description';
    }
    if (key === 'productId') {
      return 'productId';
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
            placeholder="Search product catalogs..."
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
                    <label className="text-xs text-muted-foreground mb-1 block">productCatalogName</label>
                    <Input
                      placeholder="Filter by name"
                      className="h-8 text-xs"
                      value={(filters['productCatalogName'] as string) || ''}
                      onChange={(e) =>
                        onFilterChange('productCatalogName', e.target.value || undefined)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">price</label>
                    <Input
                      type="number"
                      placeholder="Filter by price"
                      className="h-8 text-xs"
                      value={(filters['price'] as string) || ''}
                      onChange={(e) => onFilterChange('price', e.target.value || undefined)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">description</label>
                    <Input
                      placeholder="Filter by description"
                      className="h-8 text-xs"
                      value={(filters['description'] as string) || ''}
                      onChange={(e) =>
                        onFilterChange('description', e.target.value || undefined)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">productId</label>
                    <Input
                      placeholder="Filter by product ID"
                      className="h-8 text-xs"
                      value={(filters['productId'] as string) || ''}
                      onChange={(e) => onFilterChange('productId', e.target.value || undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <Badge variant="secondary">Search: {searchTerm}</Badge>
          )}
          {Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([key, value]) => (
              <Badge key={key} variant="secondary">
                {getFilterDisplayName(key)}: {getFilterDisplayValue(key, value)}
              </Badge>
            ))}
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary">
              createdDate:{' '}
              {dateRange.from ? format(dateRange.from, 'MMM dd') : '...'} -{' '}
              {dateRange.to ? format(dateRange.to, 'MMM dd') : '...'}
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
