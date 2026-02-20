import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { PriorityTable } from './components/priority-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Priorities',
};

export default function PriorityPage() {
  return (
    <PermissionGuard
      requiredPermission="priority:read"
      unauthorizedTitle="Access Denied to Priorities"
      unauthorizedDescription="You don't have permission to view priorities."
    >
      <div className="space-y-4">
        {/* Modern Centered Header */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Priorities</h1>
                <p className="text-sm text-sidebar-foreground/80">Manage priority levels</p>
              </div>
            </div>

            {/* Center Section: Create Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="priority:create">
                <Button
                  asChild
                  size="sm"
                  className="h-9 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/priorities/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Priority</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <PriorityTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
