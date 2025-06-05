"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { CityDTO } from "@/core/api/generated/spring/schemas/CityDTO";



interface CityTableRowProps {
  city: CityDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function CityTableRow({ city, onDelete, isDeleting, isSelected, onSelect }: CityTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-12 px-3 py-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => city.id && onSelect(city.id)}
        />
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        
        {city.name}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-3 py-2">
        {city.district ? 
          (city.district as any).name || city.district.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-gray-50 px-3 py-2 border-l border-gray-200">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="city:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/cities/${city.id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="city:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0"
            >
              <Link href={`/cities/${city.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="city:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => city.id && onDelete(city.id)}
              disabled={isDeleting || !city.id}
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
