"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



interface CallTableHeaderProps {
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}

export function CallTableHeader({ onSort, getSortIcon }: CallTableHeaderProps) {
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
            onClick={() => onSort("callDateTime")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            callDateTime
            {renderSortIcon("callDateTime")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("direction")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            direction
            {renderSortIcon("direction")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("durationSeconds")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            durationSeconds
            {renderSortIcon("durationSeconds")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("outcome")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            outcome
            {renderSortIcon("outcome")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("expectedRevenue")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            expectedRevenue
            {renderSortIcon("expectedRevenue")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("actualRevenue")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            actualRevenue
            {renderSortIcon("actualRevenue")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("probability")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            probability
            {renderSortIcon("probability")}
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
            onClick={() => onSort("isCompleted")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            isCompleted
            {renderSortIcon("isCompleted")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("summary")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            summary
            {renderSortIcon("summary")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("recordingUrl")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            recordingUrl
            {renderSortIcon("recordingUrl")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("internalNotes")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            internalNotes
            {renderSortIcon("internalNotes")}
          </Button>
        </TableHead>
        
        <TableHead className="whitespace-nowrap px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => onSort("status")}
            className="flex items-center gap-2 h-8 px-2 font-medium"
          >
            status
            {renderSortIcon("status")}
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
    </TableHeader>
  );
}
