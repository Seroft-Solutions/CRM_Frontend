"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



interface PartyTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}

export function PartyTableHeader({ onSort, getSortIcon }: PartyTableHeaderProps) {
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
    </TableHeader>
  );
}
