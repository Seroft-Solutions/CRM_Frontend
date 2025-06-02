"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { PartyDTO } from "@/core/api/generated/spring/schemas/PartyDTO";



interface PartyTableRowProps {
  party: PartyDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function PartyTableRow({ party, onDelete, isDeleting }: PartyTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.mobile}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.email}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.whatsApp}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.contactPerson}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.address1}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.address2}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.address3}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.website}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.partyType}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.leadStatus}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.leadScore}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.annualRevenue}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.employeeCount}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.registrationDate ? format(new Date(party.registrationDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.lastContactDate ? format(new Date(party.lastContactDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.nextFollowUpDate ? format(new Date(party.nextFollowUpDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.remark ? (
          <>
            
            <span className="text-muted-foreground">Binary data</span>
            
          </>
        ) : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.createdDate ? format(new Date(party.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {party.lastModifiedDate ? format(new Date(party.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {party.assignedTo ? 
          (party.assignedTo as any).login || party.assignedTo.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {party.createdBy ? 
          (party.createdBy as any).login || party.createdBy.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {party.source ? 
          (party.source as any).name || party.source.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {party.area ? 
          (party.area as any).name || party.area.id || "" : ""}
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        {party.city ? 
          (party.city as any).name || party.city.id || "" : ""}
      </TableCell>
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="party:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/parties/${party.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="party:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/parties/${party.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="party:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => party.id && onDelete(party.id)}
              disabled={isDeleting || !party.id}
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
