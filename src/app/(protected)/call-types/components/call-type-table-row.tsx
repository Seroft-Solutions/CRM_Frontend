"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CallTypeDTO } from "@/core/api/generated/spring/schemas/CallTypeDTO";



interface CallTypeTableRowProps {
  callType: CallTypeDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function CallTypeTableRow({ callType, onDelete, isDeleting, isSelected, onSelect }: CallTypeTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => callType.id && onSelect(callType.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callType.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callType.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callType.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callType.remark}
        
      </TableCell>
      
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="callType:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-types/${callType.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callType:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-types/${callType.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callType:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => callType.id && onDelete(callType.id)}
              disabled={isDeleting || !callType.id}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
