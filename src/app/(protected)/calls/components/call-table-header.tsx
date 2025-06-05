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
  onSelectAll
}: CallTableHeaderProps) {
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
      <TableRow className="border-b-2 border-gray-100 bg-gray-50">
        <TableHead className="w-12 px-4 py-4">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
          />
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("callDateTime")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Call Date Time
            <div className="text-gray-400">
              {renderSortIcon("callDateTime")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("status")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Status
            <div className="text-gray-400">
              {renderSortIcon("status")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("isActive")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Is Active
            <div className="text-gray-400">
              {renderSortIcon("isActive")}
            </div>
          </Button>
        </TableHead>
        
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("assignedTo.login")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Assigned To
            <div className="text-gray-400">
              {renderSortIcon("assignedTo.login")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("channelParty.login")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Channel Party
            <div className="text-gray-400">
              {renderSortIcon("channelParty.login")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("priority.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Priority
            <div className="text-gray-400">
              {renderSortIcon("priority.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("callType.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Call Type
            <div className="text-gray-400">
              {renderSortIcon("callType.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("subCallType.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Sub Call Type
            <div className="text-gray-400">
              {renderSortIcon("subCallType.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("source.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Source
            <div className="text-gray-400">
              {renderSortIcon("source.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("area.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Area
            <div className="text-gray-400">
              {renderSortIcon("area.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("product.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Product
            <div className="text-gray-400">
              {renderSortIcon("product.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("channelType.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Channel Type
            <div className="text-gray-400">
              {renderSortIcon("channelType.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("callCategory.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Call Category
            <div className="text-gray-400">
              {renderSortIcon("callCategory.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("callStatus.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Call Status
            <div className="text-gray-400">
              {renderSortIcon("callStatus.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("party.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Party
            <div className="text-gray-400">
              {renderSortIcon("party.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="w-[140px] sticky right-0 bg-gray-50 px-4 py-4 border-l border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Filter className="h-4 w-4 text-gray-500" />
            <span>Actions</span>
          </div>
        </TableHead>
      </TableRow>
      
      {/* Filter Row */}
      <TableRow className="border-b bg-white">
        <TableHead className="w-12 px-4 py-3">
          {/* Empty cell for checkbox column */}
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            type="date"
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters["callDateTime"] as string || ""}
            onChange={(e) => onFilterChange("callDateTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["status"] as string || ""}
            onChange={(e) => onFilterChange("status", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Select
            value={filters["isActive"] as string || "__all__"}
            onValueChange={(value) => onFilterChange("isActive", value === "__all__" ? undefined : value)}
          >
            <SelectTrigger className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          
        </TableHead>
        
        
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["assignedTo.login"] as string || ""}
            onChange={(e) => onFilterChange("assignedTo.login", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["channelParty.login"] as string || ""}
            onChange={(e) => onFilterChange("channelParty.login", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["priority.name"] as string || ""}
            onChange={(e) => onFilterChange("priority.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["callType.name"] as string || ""}
            onChange={(e) => onFilterChange("callType.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["subCallType.name"] as string || ""}
            onChange={(e) => onFilterChange("subCallType.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["source.name"] as string || ""}
            onChange={(e) => onFilterChange("source.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["area.name"] as string || ""}
            onChange={(e) => onFilterChange("area.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["product.name"] as string || ""}
            onChange={(e) => onFilterChange("product.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["channelType.name"] as string || ""}
            onChange={(e) => onFilterChange("channelType.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["callCategory.name"] as string || ""}
            onChange={(e) => onFilterChange("callCategory.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["callStatus.name"] as string || ""}
            onChange={(e) => onFilterChange("callStatus.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-3">
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["party.name"] as string || ""}
            onChange={(e) => onFilterChange("party.name", e.target.value || undefined)}
          />
        </TableHead>
        
        
        <TableHead className="w-[140px] sticky right-0 bg-white px-4 py-3 border-l border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Filters</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
