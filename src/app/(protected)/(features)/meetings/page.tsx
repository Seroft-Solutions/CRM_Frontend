import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { MeetingTable } from './components/meeting-table';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard, InlinePermissionGuard } from '@/components/auth/permission-guard';

export const metadata = {
  title: 'Meetings',
};

export default function MeetingPage() {
  return (
    <PermissionGuard
      requiredPermission="meeting:read"
      unauthorizedTitle="Access Denied to Meetings"
      unauthorizedDescription="You don't have permission to view meetings."
    >
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Meetings</h1>
                <p className="text-xs text-gray-600 mt-0.5">Manage your meetings</p>
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
              <InlinePermissionGuard requiredPermission="meeting:create">
                <Button
                  asChild
                  size="sm"
                  className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  <Link href="/meetings/new">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <MeetingTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
