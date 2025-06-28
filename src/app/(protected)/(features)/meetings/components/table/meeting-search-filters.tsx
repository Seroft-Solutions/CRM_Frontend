'use client';

import { useState } from 'react';
import { Filter, X, Search, CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface MeetingSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function MeetingSearchAndFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  hasActiveFilters,
}: MeetingSearchAndFiltersProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Count active filters for badge
  const activeFiltersCount =
    Object.values(filters).filter((v) => v !== undefined && v !== '').length +
    (searchTerm ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  // Remove specific filter
  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFilterChange(filterKey, undefined);
  };

  // Get filter display value
  const getFilterDisplayValue = (key: string, value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return format(value, 'MMM dd, yyyy');
    return String(value);
  };

  // Get filter display name
  const getFilterDisplayName = (key: string) => {
    // Handle relationship filters
    if (key.includes('.')) {
      const [relationName] = key.split('.');
      if (relationName === 'organizer') {
        return 'Organizer';
      }
      if (relationName === 'assignedCustomer') {
        return 'Assigned Customer';
      }
      if (relationName === 'call') {
        return 'Call';
      }
      return relationName;
    }

    // Handle regular field filters
    if (key === 'isRecurring') {
      return 'isRecurring';
    }
    if (key === 'meetingDateTime') {
      return 'meetingDateTime';
    }
    if (key === 'createdAt') {
      return 'createdAt';
    }
    if (key === 'updatedAt') {
      return 'updatedAt';
    }
    if (key === 'duration') {
      return 'duration';
    }
    if (key === 'title') {
      return 'title';
    }
    if (key === 'description') {
      return 'description';
    }
    if (key === 'meetingUrl') {
      return 'meetingUrl';
    }
    if (key === 'googleCalendarEventId') {
      return 'googleCalendarEventId';
    }
    if (key === 'notes') {
      return 'notes';
    }
    if (key === 'timeZone') {
      return 'timeZone';
    }
    if (key === 'meetingStatus') {
      return 'meetingStatus';
    }
    if (key === 'meetingType') {
      return 'meetingType';
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
            placeholder="Search meetings..."
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

              {/* Boolean Fields Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">Options</DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">isRecurring</label>
                    <Select
                      value={(filters['isRecurring'] as string) || '__all__'}
                      onValueChange={(value) =>
                        onFilterChange('isRecurring', value === '__all__' ? undefined : value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* People Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">
                  People & Relationships
                </DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Organizer</label>
                    <Input
                      placeholder="Filter by organizer..."
                      value={(filters['organizer.displayName'] as string) || ''}
                      onChange={(e) =>
                        onFilterChange('organizer.displayName', e.target.value || undefined)
                      }
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Assigned Customer
                    </label>
                    <Input
                      placeholder="Filter by assigned customer..."
                      value={(filters['assignedCustomer.customerBusinessName'] as string) || ''}
                      onChange={(e) =>
                        onFilterChange(
                          'assignedCustomer.customerBusinessName',
                          e.target.value || undefined
                        )
                      }
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Call</label>
                    <Input
                      placeholder="Filter by call..."
                      value={(filters['call.name'] as string) || ''}
                      onChange={(e) => onFilterChange('call.name', e.target.value || undefined)}
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
                    meetingDateTime Range
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
                    <label className="text-xs text-muted-foreground mb-1 block">duration</label>
                    <Input
                      placeholder="Filter by duration..."
                      value={(filters['duration'] as string) || ''}
                      onChange={(e) => onFilterChange('duration', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">title</label>
                    <Input
                      placeholder="Filter by title..."
                      value={(filters['title'] as string) || ''}
                      onChange={(e) => onFilterChange('title', e.target.value || undefined)}
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
