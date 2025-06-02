"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { SubCallTypeDTO } from "@/core/api/generated/spring/schemas/SubCallTypeDTO";



interface SubCallTypeTableRowProps {
  subCallType: SubCallTypeDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function SubCallTypeTableRow({ subCallType, onDelete, isDeleting }: SubCallTypeTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.code}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.sortOrder}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.remark ? (
          <>
            
            <span className="text-muted-foreground">Binary data</span>
            
          </>
        ) : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.createdDate ? format(new Date(subCallType.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {subCallType.lastModifiedDate ? format(new Date(subCallType.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {subCallType.callType ? 
          (subCallType.callType as any).name || subCallType.callType.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="subCallType:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/sub-call-types/${subCallType.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="subCallType:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/sub-call-types/${subCallType.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="subCallType:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => subCallType.id && onDelete(subCallType.id)}
              disabled={isDeleting || !subCallType.id}
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
