import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { StateTable } from "./components/state-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "States",
};

export default function StatePage() {
  return (
    <PermissionGuard 
      requiredPermission="state:read"
      unauthorizedTitle="Access Denied to States"
      unauthorizedDescription="You don't have permission to view states."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader>
            <PageTitle>States</PageTitle>
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
            <InlinePermissionGuard requiredPermission="state:create">
              <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/states/new">
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
          <StateTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
