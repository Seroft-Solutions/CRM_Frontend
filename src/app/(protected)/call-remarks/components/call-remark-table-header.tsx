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

interface CallRemarkTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
  filters: FilterState;
  onFilterChange: (column: string, value: any) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

export function CallRemarkTableHeader({ 
  onSort, 
  getSortIcon,
  filters,
  onFilterChange,
  isAllSelected,
  isIndeterminate,
  onSelectAll
}: CallRemarkTableHeaderProps) {
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
            onClick={() => onSort("dateTime")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Date Time
            {renderSortIcon("dateTime")}
          </Button>
        </TableHead>
        
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("call.name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Call
            {renderSortIcon("call.name")}
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
            value={filters["remark"] as string || ""}
            onChange={(e) => onFilterChange("remark", e.target.value || undefined)}
          />
          
        </TableHead>
        
        <TableHead className="px-4 py-2">
          
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters["dateTime"] as string || ""}
            onChange={(e) => onFilterChange("dateTime", e.target.value || undefined)}
          />
          
        </TableHead>
        
        
        
        <TableHead className="px-4 py-2">
          <Input
            placeholder="Filter..."
            className="h-8 text-xs"
            value={filters["call.name"] as string || ""}
            onChange={(e) => onFilterChange("call.name", e.target.value || undefined)}
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
