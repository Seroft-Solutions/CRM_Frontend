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

interface PartyTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function PartyTableHeader({ 
  onSort, 
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: PartyTableHeaderProps) {
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
            onClick={() => onSort("name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Name
            <div className="text-gray-400">
              {renderSortIcon("name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("mobile")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Mobile
            <div className="text-gray-400">
              {renderSortIcon("mobile")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("email")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Email
            <div className="text-gray-400">
              {renderSortIcon("email")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("whatsApp")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Whats App
            <div className="text-gray-400">
              {renderSortIcon("whatsApp")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("contactPerson")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Contact Person
            <div className="text-gray-400">
              {renderSortIcon("contactPerson")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("address1")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Address1
            <div className="text-gray-400">
              {renderSortIcon("address1")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("address2")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Address2
            <div className="text-gray-400">
              {renderSortIcon("address2")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => onSort("address3")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Address3
            <div className="text-gray-400">
              {renderSortIcon("address3")}
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
            onClick={() => onSort("remark")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            Remark
            <div className="text-gray-400">
              {renderSortIcon("remark")}
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
            onClick={() => onSort("city.name")}
            className="flex items-center gap-2 h-auto px-2 py-1 font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
          >
            City
            <div className="text-gray-400">
              {renderSortIcon("city.name")}
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
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["name"] as string || ""}
            onChange={(e) => onFilterChange("name", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["mobile"] as string || ""}
            onChange={(e) => onFilterChange("mobile", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["email"] as string || ""}
            onChange={(e) => onFilterChange("email", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["whatsApp"] as string || ""}
            onChange={(e) => onFilterChange("whatsApp", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["contactPerson"] as string || ""}
            onChange={(e) => onFilterChange("contactPerson", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address1"] as string || ""}
            onChange={(e) => onFilterChange("address1", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address2"] as string || ""}
            onChange={(e) => onFilterChange("address2", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-3">
          
          <Input
            placeholder="Filter..."
            className="h-9 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address3"] as string || ""}
            onChange={(e) => onFilterChange("address3", e.target.value || undefined)}
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
            value={filters["remark"] as string || ""}
            onChange={(e) => onFilterChange("remark", e.target.value || undefined)}
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
            value={filters["city.name"] as string || ""}
            onChange={(e) => onFilterChange("city.name", e.target.value || undefined)}
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
