"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { StateDTO } from "@/core/api/generated/spring/schemas/StateDTO";



interface StateTableRowProps {
  state: StateDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function StateTableRow({ state, onDelete, isDeleting }: StateTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {state.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {state.country}
        
      </TableCell>
      
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="state:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/states/${state.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="state:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/states/${state.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="state:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => state.id && onDelete(state.id)}
              disabled={isDeleting || !state.id}
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
