"use client";

import { useState } from "react";
import {
  Filter,
  X,
  Search,
  CalendarIcon,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";



interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PartySearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function PartySearchAndFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  hasActiveFilters
}: PartySearchAndFiltersProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Count active filters for badge
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== "").length + 
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
      if (relationName === 'source') {
        return 'Source';
      }
      if (relationName === 'area') {
        return 'Area';
      }
      if (relationName === 'city') {
        return 'City';
      }
      return relationName;
    }
    
    // Handle regular field filters
    if (key === 'isActive') {
      return 'isActive';
    }
    if (key === 'name') {
      return 'name';
    }
    if (key === 'mobile') {
      return 'mobile';
    }
    if (key === 'email') {
      return 'email';
    }
    if (key === 'whatsApp') {
      return 'whatsApp';
    }
    if (key === 'contactPerson') {
      return 'contactPerson';
    }
    if (key === 'address1') {
      return 'address1';
    }
    if (key === 'address2') {
      return 'address2';
    }
    if (key === 'address3') {
      return 'address3';
    }
    if (key === 'remark') {
      return 'remark';
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
            placeholder="Search parties..."
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
                    <label className="text-xs text-muted-foreground mb-1 block">
                      isActive
                    </label>
                    <Select
                      value={filters["isActive"] as string || ""}
                      onValueChange={(value) => onFilterChange("isActive", value || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
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
                <DropdownMenuLabel className="px-0 text-sm font-medium">People & Relationships</DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Source
                    </label>
                    <Input
                      placeholder="Filter by source..."
                      value={filters["source.name"] as string || ""}
                      onChange={(e) => onFilterChange("source.name", e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Area
                    </label>
                    <Input
                      placeholder="Filter by area..."
                      value={filters["area.name"] as string || ""}
                      onChange={(e) => onFilterChange("area.name", e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      City
                    </label>
                    <Input
                      placeholder="Filter by city..."
                      value={filters["city.name"] as string || ""}
                      onChange={(e) => onFilterChange("city.name", e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                  
                </div>
              </div>
              

              

              
              <DropdownMenuSeparator />
              
              {/* Other Fields Section */}
              <div>
                <DropdownMenuLabel className="px-0 text-sm font-medium">Other Fields</DropdownMenuLabel>
                <div className="space-y-2 mt-2">
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      name
                    </label>
                    <Input
                      placeholder="Filter by name..."
                      value={filters["name"] as string || ""}
                      onChange={(e) => onFilterChange("name", e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      mobile
                    </label>
                    <Input
                      placeholder="Filter by mobile..."
                      value={filters["mobile"] as string || ""}
                      onChange={(e) => onFilterChange("mobile", e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      email
                    </label>
                    <Input
                      placeholder="Filter by email..."
                      value={filters["email"] as string || ""}
                      onChange={(e) => onFilterChange("email", e.target.value || undefined)}
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
                onClick={() => onSearchChange({ target: { value: "" } } as any)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {Object.entries(filters).map(([key, value]) => (
            value !== undefined && value !== "" && (
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
          ))}
          
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {dateRange.from && format(dateRange.from, "MMM dd")}
              {dateRange.from && dateRange.to && " - "}
              {dateRange.to && format(dateRange.to, "MMM dd")}
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
