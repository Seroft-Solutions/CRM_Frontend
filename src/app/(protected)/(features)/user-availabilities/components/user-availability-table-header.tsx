"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface UserAvailabilityTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function UserAvailabilityTableHeader({ 
  onSort, 
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: UserAvailabilityTableHeaderProps) {
  const renderSortIcon = (column: string) => {
    const iconType = getSortIcon(column);
    switch (iconType) {
      case "ChevronUp":
        return <ChevronUp className="h-4 w-4" />;
      case "ChevronDown":
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
            onClick={() => onSort("dayOfWeek")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Day Of Week
            <div className="text-gray-400">
              {renderSortIcon("dayOfWeek")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("startTime")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Start Time
            <div className="text-gray-400">
              {renderSortIcon("startTime")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("endTime")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            End Time
            <div className="text-gray-400">
              {renderSortIcon("endTime")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("isAvailable")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Is Available
            <div className="text-gray-400">
              {renderSortIcon("isAvailable")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("effectiveFrom")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Effective From
            <div className="text-gray-400">
              {renderSortIcon("effectiveFrom")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("effectiveTo")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Effective To
            <div className="text-gray-400">
              {renderSortIcon("effectiveTo")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("timeZone")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Time Zone
            <div className="text-gray-400">
              {renderSortIcon("timeZone")}
            </div>
          </Button>
        </TableHead>
        
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("user.displayName")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            User
            <div className="text-gray-400">
              {renderSortIcon("user.displayName")}
            </div>
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
        <TableHead className="w-12 px-3 py-2">
          {/* Empty cell for checkbox column */}
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["dayOfWeek"] as string || ""}
            onChange={(e) => onFilterChange("dayOfWeek", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["startTime"] as string || ""}
            onChange={(e) => onFilterChange("startTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["endTime"] as string || ""}
            onChange={(e) => onFilterChange("endTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Select
            value={filters["isAvailable"] as string || "__all__"}
            onValueChange={(value) => onFilterChange("isAvailable", value === "__all__" ? undefined : value)}
          >
            <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            type="date"
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters["effectiveFrom"] as string || ""}
            onChange={(e) => onFilterChange("effectiveFrom", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            type="date"
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters["effectiveTo"] as string || ""}
            onChange={(e) => onFilterChange("effectiveTo", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["timeZone"] as string || ""}
            onChange={(e) => onFilterChange("timeZone", e.target.value || undefined)}
          />
          
        </TableHead>
        
        
        
        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["user.displayName"] as string || ""}
            onChange={(e) => onFilterChange("user.displayName", e.target.value || undefined)}
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
