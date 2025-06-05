import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { ChannelTypeTable } from "./components/channel-type-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "ChannelTypes",
};

export default function ChannelTypePage() {
  return (
    <PermissionGuard 
      requiredPermission="channelType:read"
      unauthorizedTitle="Access Denied to Channel Types"
      unauthorizedDescription="You don't have permission to view channel types."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h1 className="text-2xl font-bold text-gray-900">Channel Types</h1>
          </div>
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
            <InlinePermissionGuard requiredPermission="channelType:create">
              <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/channel-types/new">
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
          <ChannelTypeTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
