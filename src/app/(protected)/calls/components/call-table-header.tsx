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
            onClick={() => onSort("callDateTime")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Call Date Time
            {renderSortIcon("callDateTime")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("status")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Status
            {renderSortIcon("status")}
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
            onClick={() => onSort("assignedTo.login")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Assigned To
            {renderSortIcon("assignedTo.login")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("channelParty.login")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Channel Party
            {renderSortIcon("channelParty.login")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("priority.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Priority
            {renderSortIcon("priority.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("callType.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Call Type
            {renderSortIcon("callType.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("subCallType.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Sub Call Type
            {renderSortIcon("subCallType.name")}
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
            onClick={() => onSort("product.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Product
            {renderSortIcon("product.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("channelType.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Channel Type
            {renderSortIcon("channelType.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("callCategory.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Call Category
            {renderSortIcon("callCategory.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("callStatus.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Call Status
            {renderSortIcon("callStatus.name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("party.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Party
            {renderSortIcon("party.name")}
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
            type="date"
            className="h-8 text-xs"
            value={filters["callDateTime"] as string || ""}
            onChange={(e) => onFilterChange("callDateTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["status"] as string || ""}
            onChange={(e) => onFilterChange("status", e.target.value || undefined)}
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
            value={filters["assignedTo.login"] as string || ""}
            onChange={(e) => onFilterChange("assignedTo.login", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["channelParty.login"] as string || ""}
            onChange={(e) => onFilterChange("channelParty.login", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["priority.name"] as string || ""}
            onChange={(e) => onFilterChange("priority.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["callType.name"] as string || ""}
            onChange={(e) => onFilterChange("callType.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["subCallType.name"] as string || ""}
            onChange={(e) => onFilterChange("subCallType.name", e.target.value || undefined)}
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
            value={filters["product.name"] as string || ""}
            onChange={(e) => onFilterChange("product.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["channelType.name"] as string || ""}
            onChange={(e) => onFilterChange("channelType.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["callCategory.name"] as string || ""}
            onChange={(e) => onFilterChange("callCategory.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["callStatus.name"] as string || ""}
            onChange={(e) => onFilterChange("callStatus.name", e.target.value || undefined)}
          />
        </TableHead>
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["party.name"] as string || ""}
            onChange={(e) => onFilterChange("party.name", e.target.value || undefined)}
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
