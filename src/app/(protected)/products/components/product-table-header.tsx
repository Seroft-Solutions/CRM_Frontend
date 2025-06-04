"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



interface ProductTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}

export function ProductTableHeader({ onSort, getSortIcon }: ProductTableHeaderProps) {
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
    </TableHeader>
  );
}
