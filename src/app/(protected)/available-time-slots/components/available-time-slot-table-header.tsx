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

interface AvailableTimeSlotTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function AvailableTimeSlotTableHeader({ 
  onSort, 
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: AvailableTimeSlotTableHeaderProps) {
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
            onClick={() => onSort("slotDateTime")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Slot Date Time
            <div className="text-gray-400">
              {renderSortIcon("slotDateTime")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("duration")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Duration
            <div className="text-gray-400">
              {renderSortIcon("duration")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("isBooked")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Is Booked
            <div className="text-gray-400">
              {renderSortIcon("isBooked")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("bookedAt")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Booked At
            <div className="text-gray-400">
              {renderSortIcon("bookedAt")}
            </div>
          </Button>
        </TableHead>
        
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("user.email")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            User
            <div className="text-gray-400">
              {renderSortIcon("user.email")}
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
            type="date"
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters["slotDateTime"] as string || ""}
            onChange={(e) => onFilterChange("slotDateTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["duration"] as string || ""}
            onChange={(e) => onFilterChange("duration", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Select
            value={filters["isBooked"] as string || "__all__"}
            onValueChange={(value) => onFilterChange("isBooked", value === "__all__" ? undefined : value)}
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
            value={filters["bookedAt"] as string || ""}
            onChange={(e) => onFilterChange("bookedAt", e.target.value || undefined)}
          />
          
        </TableHead>
        
        
        
        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["user.email"] as string || ""}
            onChange={(e) => onFilterChange("user.email", e.target.value || undefined)}
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
