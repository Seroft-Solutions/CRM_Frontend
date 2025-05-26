import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { ProductTable } from "./components/product-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Products",
};

export default function ProductPage() {
  return (
    <PermissionGuard 
      requiredPermission="product:read"
      unauthorizedTitle="Access Denied to Products"
      unauthorizedDescription="You don't have permission to view products."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader>
            <PageTitle>Products</PageTitle>
          </PageHeader>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              aria-label="Refresh List"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Refresh List
              </span>
            </Button>
            <InlinePermissionGuard requiredPermission="product:create">
              <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/products/new">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Create
                  </span>
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ProductTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
