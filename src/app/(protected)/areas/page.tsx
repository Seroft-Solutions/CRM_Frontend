import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { AreaTable } from "./components/area-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Areas",
};

export default function AreaPage() {
  return (
    <PermissionGuard 
      requiredPermission="area:read"
      unauthorizedTitle="Access Denied to Areas"
      unauthorizedDescription="You don't have permission to view areas."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader>
            <PageTitle>Areas</PageTitle>
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
            <InlinePermissionGuard requiredPermission="area:create">
              <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/areas/new">
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
          <AreaTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
