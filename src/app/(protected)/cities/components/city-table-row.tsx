"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CityDTO } from "@/core/api/generated/schemas/CityDTO";



interface CityTableRowProps {
  city: CityDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function CityTableRow({ city, onDelete, isDeleting }: CityTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {city.name}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {city.district ? 
          city.district.name : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="city:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/cities/${city.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="city:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/cities/${city.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="city:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => onDelete(city.id)}
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
