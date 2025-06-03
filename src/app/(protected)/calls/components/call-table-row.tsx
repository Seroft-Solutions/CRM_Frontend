"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CallDTO } from "@/core/api/generated/spring/schemas/CallDTO";



interface CallTableRowProps {
  call: CallDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function CallTableRow({ call, onDelete, isDeleting }: CallTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.callDateTime ? format(new Date(call.callDateTime), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.direction}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.durationSeconds}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.outcome}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.expectedRevenue}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.actualRevenue}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.probability}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.nextFollowUpDate ? format(new Date(call.nextFollowUpDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.isCompleted ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.summary}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.recordingUrl}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.internalNotes}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.status}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.createdDate ? format(new Date(call.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {call.lastModifiedDate ? format(new Date(call.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.assignedTo ? 
          (call.assignedTo as any).login || call.assignedTo.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.channelParty ? 
          (call.channelParty as any).login || call.channelParty.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.createdBy ? 
          (call.createdBy as any).login || call.createdBy.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.priority ? 
          (call.priority as any).name || call.priority.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callType ? 
          (call.callType as any).name || call.callType.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.subCallType ? 
          (call.subCallType as any).name || call.subCallType.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.source ? 
          (call.source as any).name || call.source.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.area ? 
          (call.area as any).name || call.area.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.product ? 
          (call.product as any).name || call.product.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.channelType ? 
          (call.channelType as any).name || call.channelType.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callCategory ? 
          (call.callCategory as any).name || call.callCategory.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.callStatus ? 
          (call.callStatus as any).name || call.callStatus.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {call.party ? 
          (call.party as any).name || call.party.id || "" : ""}
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
              onClick={() => call.id && onDelete(call.id)}
              disabled={isDeleting || !call.id}
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
