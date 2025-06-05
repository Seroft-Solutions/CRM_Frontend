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
            onClick={() => onSort("mobile")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Mobile
            {renderSortIcon("mobile")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("email")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Email
            {renderSortIcon("email")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("whatsApp")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Whats App
            {renderSortIcon("whatsApp")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("contactPerson")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Contact Person
            {renderSortIcon("contactPerson")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address1")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Address1
            {renderSortIcon("address1")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address2")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Address2
            {renderSortIcon("address2")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address3")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Address3
            {renderSortIcon("address3")}
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
        
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("source.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Source
            {renderSortIcon("source.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("area.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Area
            {renderSortIcon("area.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("city.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            City
            {renderSortIcon("city.name")}
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
            value={filters["mobile"] as string || ""}
            onChange={(e) => onFilterChange("mobile", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["email"] as string || ""}
            onChange={(e) => onFilterChange("email", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["whatsApp"] as string || ""}
            onChange={(e) => onFilterChange("whatsApp", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["contactPerson"] as string || ""}
            onChange={(e) => onFilterChange("contactPerson", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["address1"] as string || ""}
            onChange={(e) => onFilterChange("address1", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["address2"] as string || ""}
            onChange={(e) => onFilterChange("address2", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["address3"] as string || ""}
            onChange={(e) => onFilterChange("address3", e.target.value || undefined)}
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
        
        
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["source.name"] as string || ""}
            onChange={(e) => onFilterChange("source.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["area.name"] as string || ""}
            onChange={(e) => onFilterChange("area.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["city.name"] as string || ""}
            onChange={(e) => onFilterChange("city.name", e.target.value || undefined)}
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
