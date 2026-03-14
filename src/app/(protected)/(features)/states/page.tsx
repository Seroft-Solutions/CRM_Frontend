import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Map } from 'lucide-react';
import Link from 'next/link';

import { StateTable } from './components/state-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'States',
};

export default function StatePage() {
  return (
    <PermissionGuard
      requiredPermission="state:read"
      unauthorizedTitle="Access Denied to States"
      unauthorizedDescription="You don't have permission to view states."
    >
      <div className="space-y-4">
        {/* Modern Centered Header */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Map className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">States</h1>
                <p className="text-sm text-sidebar-foreground/80">Manage state regions</p>
              </div>
            </div>

            {/* Center Section: Create Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="state:create">
                <Button
                  asChild
                  size="sm"
                  className="h-9 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/states/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New State</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <StateTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
