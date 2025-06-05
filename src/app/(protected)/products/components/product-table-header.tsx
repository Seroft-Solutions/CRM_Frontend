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

interface ProductTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function ProductTableHeader({ 
  onSort, 
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: ProductTableHeaderProps) {
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
      <TableRow>
        <TableHead className="w-12 px-4 py-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
          />
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Name
            {renderSortIcon("name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("code")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Code
            {renderSortIcon("code")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("description")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Description
            {renderSortIcon("description")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("category")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Category
            {renderSortIcon("category")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("basePrice")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Base Price
            {renderSortIcon("basePrice")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("minPrice")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Min Price
            {renderSortIcon("minPrice")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("maxPrice")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Max Price
            {renderSortIcon("maxPrice")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("isActive")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Is Active
            {renderSortIcon("isActive")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("remark")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Remark
            {renderSortIcon("remark")}
          </Button>
        </TableHead>
        
        
        <TableHead className="w-[120px] sticky right-0 bg-background px-4 py-3">Actions</TableHead>
      </TableRow>
      
      {/* Filter Row */}
      <TableRow className="border-b">
        <TableHead className="w-12 px-4 py-2">
          {/* Empty cell for checkbox column */}
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["name"] as string || ""}
            onChange={(e) => onFilterChange("name", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["code"] as string || ""}
            onChange={(e) => onFilterChange("code", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["description"] as string || ""}
            onChange={(e) => onFilterChange("description", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["category"] as string || ""}
            onChange={(e) => onFilterChange("category", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["basePrice"] as string || ""}
            onChange={(e) => onFilterChange("basePrice", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["minPrice"] as string || ""}
            onChange={(e) => onFilterChange("minPrice", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["maxPrice"] as string || ""}
            onChange={(e) => onFilterChange("maxPrice", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Select
            value={filters["isActive"] as string || "__all__"}
            onValueChange={(value) => onFilterChange("isActive", value === "__all__" ? undefined : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["remark"] as string || ""}
            onChange={(e) => onFilterChange("remark", e.target.value || undefined)}
          />
          
        </TableHead>
        
        
        
        
        <TableHead className="w-[120px] sticky right-0 bg-background px-4 py-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filters</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
