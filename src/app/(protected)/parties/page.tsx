import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { PartyTable } from "./components/party-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Parties",
};

export default function PartyPage() {
  return (
    <PermissionGuard 
      requiredPermission="party:read"
      unauthorizedTitle="Access Denied to Parties"
      unauthorizedDescription="You don't have permission to view parties."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your parties</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-gray-300 hover:bg-gray-50"
                aria-label="Refresh List"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh List</span>
              </Button>
              <InlinePermissionGuard requiredPermission="party:create">
                <Button asChild size="sm" className="h-9 gap-2 bg-blue-600 hover:bg-blue-700">
                  <Link href="/parties/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <PartyTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
