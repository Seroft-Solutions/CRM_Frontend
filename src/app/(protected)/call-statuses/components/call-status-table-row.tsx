"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CallStatusDTO } from "@/core/api/generated/spring/schemas/CallStatusDTO";



interface CallStatusTableRowProps {
  callStatus: CallStatusDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function CallStatusTableRow({ callStatus, onDelete, isDeleting, isSelected, onSelect }: CallStatusTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => callStatus.id && onSelect(callStatus.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callStatus.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callStatus.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callStatus.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callStatus.remark}
        
      </TableCell>
      
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="callStatus:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-statuses/${callStatus.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callStatus:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-statuses/${callStatus.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callStatus:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => callStatus.id && onDelete(callStatus.id)}
              disabled={isDeleting || !callStatus.id}
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
