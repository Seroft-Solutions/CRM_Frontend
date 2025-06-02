"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { AreaDTO } from "@/core/api/generated/spring/schemas/AreaDTO";



interface AreaTableRowProps {
  area: AreaDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function AreaTableRow({ area, onDelete, isDeleting }: AreaTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.pincode}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.areaType}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.createdDate ? format(new Date(area.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {area.lastModifiedDate ? format(new Date(area.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {area.city ? 
          (area.city as any).name || area.city.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="area:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/areas/${area.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="area:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/areas/${area.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="area:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => area.id && onDelete(area.id)}
              disabled={isDeleting || !area.id}
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
