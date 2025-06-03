"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { ChannelTypeDTO } from "@/core/api/generated/spring/schemas/ChannelTypeDTO";



interface ChannelTypeTableRowProps {
  channelType: ChannelTypeDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function ChannelTypeTableRow({ channelType, onDelete, isDeleting }: ChannelTypeTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.code}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.commissionRate}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.sortOrder}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.remark}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.createdDate ? format(new Date(channelType.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {channelType.lastModifiedDate ? format(new Date(channelType.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="channelType:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/channel-types/${channelType.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="channelType:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/channel-types/${channelType.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="channelType:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => channelType.id && onDelete(channelType.id)}
              disabled={isDeleting || !channelType.id}
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
