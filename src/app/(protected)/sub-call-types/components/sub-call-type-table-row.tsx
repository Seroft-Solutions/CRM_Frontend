"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { SubCallTypeDTO } from "@/core/api/generated/spring/schemas/SubCallTypeDTO";



interface SubCallTypeTableRowProps {
  subCallType: SubCallTypeDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function SubCallTypeTableRow({ subCallType, onDelete, isDeleting, isSelected, onSelect }: SubCallTypeTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => subCallType.id && onSelect(subCallType.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {subCallType.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {subCallType.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {subCallType.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {subCallType.remark}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        {subCallType.callType ? 
          (subCallType.callType as any).name || subCallType.callType.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="subCallType:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/sub-call-types/${subCallType.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="subCallType:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/sub-call-types/${subCallType.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="subCallType:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => subCallType.id && onDelete(subCallType.id)}
              disabled={isDeleting || !subCallType.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}
