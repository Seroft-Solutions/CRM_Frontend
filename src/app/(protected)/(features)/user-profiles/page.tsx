import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { UserProfileTable } from "./components/user-profile-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";

export const metadata = {
  title: "UserProfiles",
};

export default function UserProfilePage() {
  return (
    <PermissionGuard 
      requiredPermission="userProfile:read"
      unauthorizedTitle="Access Denied to User Profiles"
      unauthorizedDescription="You don't have permission to view user profiles."
    >
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">User Profiles</h1>
                <p className="text-xs text-gray-600 mt-0.5">Manage your user profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-gray-300 hover:bg-gray-50 text-xs"
                aria-label="Refresh List"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <InlinePermissionGuard requiredPermission="userProfile:create">
                <Button asChild size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs">
                  <Link href="/user-profiles/new">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <UserProfileTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
