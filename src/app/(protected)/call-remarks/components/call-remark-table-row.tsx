"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CallRemarkDTO } from "@/core/api/generated/spring/schemas/CallRemarkDTO";



interface CallRemarkTableRowProps {
  callRemark: CallRemarkDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function CallRemarkTableRow({ callRemark, onDelete, isDeleting }: CallRemarkTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.remark ? (
          <>
            
            <span className="text-muted-foreground">Binary data</span>
            
          </>
        ) : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.dateTime ? format(new Date(callRemark.dateTime), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.isPrivate ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.remarkType}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.actionItems}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.createdDate ? format(new Date(callRemark.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {callRemark.lastModifiedDate ? format(new Date(callRemark.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {callRemark.createdBy ? 
          (callRemark.createdBy as any).login || callRemark.createdBy.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {callRemark.call ? 
          (callRemark.call as any).name || callRemark.call.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="callRemark:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-remarks/${callRemark.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callRemark:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/call-remarks/${callRemark.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="callRemark:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => callRemark.id && onDelete(callRemark.id)}
              disabled={isDeleting || !callRemark.id}
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
