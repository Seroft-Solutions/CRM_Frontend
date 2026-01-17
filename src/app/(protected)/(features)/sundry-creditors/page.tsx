import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

import { SundryCreditorTable } from './components/sundry-creditor-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';
import Link from 'next/link';

export const metadata = {
  title: 'Sundry Creditors',
};

export default function SundryCreditorPage() {
  return (
    <PermissionGuard
      requiredPermission="sundryCreditor:read"
      unauthorizedTitle="Access Denied to Sundry Creditors"
      unauthorizedDescription="You don't have permission to view sundry creditors."
    >
      <div className="space-y-4">
        {/* Modern Centered Header with Sidebar Theme */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Sundry Creditors</h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Manage your sundry creditor database
                </p>
              </div>
            </div>

            {/* Center Section: Prominent New Creditor Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="sundryCreditor:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/sundry-creditors/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Creditor</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SundryCreditorTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
