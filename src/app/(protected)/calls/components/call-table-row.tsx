"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CallDTO } from "@/core/api/generated/schemas/CallDTO";



interface CallTableRowProps {
  call: CallDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function CallTableRow({ call, onDelete, isDeleting }: CallTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.status}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.assignedTo ? 
          call.assignedTo.login : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.channelParty ? 
          call.channelParty.login : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.priority ? 
          call.priority.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callType ? 
          call.callType.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.subCallType ? 
          call.subCallType.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.source ? 
          call.source.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.area ? 
          call.area.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.party ? 
          call.party.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.product ? 
          call.product.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.channelType ? 
          call.channelType.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callCategory ? 
          call.callCategory.name : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callStatus ? 
          call.callStatus.name : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="call:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/calls/${call.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="call:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/calls/${call.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="call:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => onDelete(call.id)}
              disabled={isDeleting}
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
