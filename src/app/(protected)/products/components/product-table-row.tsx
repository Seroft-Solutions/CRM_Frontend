"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";
import type { ProductDTO } from "@/core/api/generated/spring/schemas/ProductDTO";



interface ProductTableRowProps {
  product: ProductDTO;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function ProductTableRow({ product, onDelete, isDeleting }: ProductTableRowProps) {
  return (
    <TableRow>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.name}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.code}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.description}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.category}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.basePrice}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.minPrice}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.maxPrice}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.isActive ? "Yes" : "No"}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.launchDate ? format(new Date(product.launchDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.features ? (
          <>
            
            <span className="text-muted-foreground">Binary data</span>
            
          </>
        ) : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.remark ? (
          <>
            
            <span className="text-muted-foreground">Binary data</span>
            
          </>
        ) : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.createdDate ? format(new Date(product.createdDate), "PPP") : ""}
        
      </TableCell>
      
      <TableCell className="whitespace-nowrap px-4 py-3">
        
        {product.lastModifiedDate ? format(new Date(product.lastModifiedDate), "PPP") : ""}
        
      </TableCell>
      
      
      <TableCell className="sticky right-0 bg-background px-4 py-3">
        <div className="flex items-center gap-1">
          <InlinePermissionGuard requiredPermission="product:read">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:update">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="product:delete">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => product.id && onDelete(product.id)}
              disabled={isDeleting || !product.id}
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
