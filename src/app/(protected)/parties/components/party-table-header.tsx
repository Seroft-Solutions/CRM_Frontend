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
            name
            {renderSortIcon("name")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("mobile")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            mobile
            {renderSortIcon("mobile")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("email")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            email
            {renderSortIcon("email")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("whatsApp")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            whatsApp
            {renderSortIcon("whatsApp")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("contactPerson")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            contactPerson
            {renderSortIcon("contactPerson")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address1")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            address1
            {renderSortIcon("address1")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address2")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            address2
            {renderSortIcon("address2")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("address3")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            address3
            {renderSortIcon("address3")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("website")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            website
            {renderSortIcon("website")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("partyType")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            partyType
            {renderSortIcon("partyType")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("leadStatus")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            leadStatus
            {renderSortIcon("leadStatus")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("leadScore")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            leadScore
            {renderSortIcon("leadScore")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("annualRevenue")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            annualRevenue
            {renderSortIcon("annualRevenue")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("employeeCount")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            employeeCount
            {renderSortIcon("employeeCount")}
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
            onClick={() => onSort("registrationDate")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            registrationDate
            {renderSortIcon("registrationDate")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("lastContactDate")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            lastContactDate
            {renderSortIcon("lastContactDate")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("nextFollowUpDate")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            nextFollowUpDate
            {renderSortIcon("nextFollowUpDate")}
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
            onClick={() => onSort("createdBy.login")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            Created By
            {renderSortIcon("createdBy.login")}
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
