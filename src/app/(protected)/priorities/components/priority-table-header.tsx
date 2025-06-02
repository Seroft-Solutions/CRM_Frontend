"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



interface PriorityTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}

export function PriorityTableHeader({ onSort, getSortIcon }: PriorityTableHeaderProps) {
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
      <TableRow>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("name")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            name
            {renderSortIcon("name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("level")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            level
            {renderSortIcon("level")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("description")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            description
            {renderSortIcon("description")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("colorCode")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            colorCode
            {renderSortIcon("colorCode")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("sortOrder")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            sortOrder
            {renderSortIcon("sortOrder")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("remark")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            remark
            {renderSortIcon("remark")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("isActive")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            isActive
            {renderSortIcon("isActive")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("createdDate")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            createdDate
            {renderSortIcon("createdDate")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("lastModifiedDate")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            lastModifiedDate
            {renderSortIcon("lastModifiedDate")}
          </Button>
        </TableHead>
        
        
        <TableHead className="w-[120px] sticky right-0 bg-background px-4 py-3">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
