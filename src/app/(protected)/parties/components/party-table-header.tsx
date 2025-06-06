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
            onClick={() => onSort("name")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Name
            <div className="text-gray-400">
              {renderSortIcon("name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("mobile")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Mobile
            <div className="text-gray-400">
              {renderSortIcon("mobile")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("email")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Email
            <div className="text-gray-400">
              {renderSortIcon("email")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("whatsApp")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Whats App
            <div className="text-gray-400">
              {renderSortIcon("whatsApp")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("contactPerson")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Contact Person
            <div className="text-gray-400">
              {renderSortIcon("contactPerson")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("address1")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Address1
            <div className="text-gray-400">
              {renderSortIcon("address1")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("address2")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Address2
            <div className="text-gray-400">
              {renderSortIcon("address2")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("address3")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Address3
            <div className="text-gray-400">
              {renderSortIcon("address3")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("isActive")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Is Active
            <div className="text-gray-400">
              {renderSortIcon("isActive")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("remark")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Remark
            <div className="text-gray-400">
              {renderSortIcon("remark")}
            </div>
          </Button>
        </TableHead>
        
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("source.name")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Source
            <div className="text-gray-400">
              {renderSortIcon("source.name")}
            </div>
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-3 py-2">
          <Button
            variant="ghost"
            onClick={() => onSort("area.name")}
            className="flex items-center gap-1.5 h-auto px-2 py-1 font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded text-sm transition-colors"
          >
            Area
            <div className="text-gray-400">
              {renderSortIcon("area.name")}
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
            value={filters["name"] as string || ""}
            onChange={(e) => onFilterChange("name", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["mobile"] as string || ""}
            onChange={(e) => onFilterChange("mobile", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["email"] as string || ""}
            onChange={(e) => onFilterChange("email", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["whatsApp"] as string || ""}
            onChange={(e) => onFilterChange("whatsApp", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["contactPerson"] as string || ""}
            onChange={(e) => onFilterChange("contactPerson", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address1"] as string || ""}
            onChange={(e) => onFilterChange("address1", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address2"] as string || ""}
            onChange={(e) => onFilterChange("address2", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["address3"] as string || ""}
            onChange={(e) => onFilterChange("address3", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-3 py-2">
          
          <Select
            value={filters["isActive"] as string || "__all__"}
            onValueChange={(value) => onFilterChange("isActive", value === "__all__" ? undefined : value)}
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
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["remark"] as string || ""}
            onChange={(e) => onFilterChange("remark", e.target.value || undefined)}
          />
          
        </TableHead>
        
        
        
        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["source.name"] as string || ""}
            onChange={(e) => onFilterChange("source.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-3 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            value={filters["area.name"] as string || ""}
            onChange={(e) => onFilterChange("area.name", e.target.value || undefined)}
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
