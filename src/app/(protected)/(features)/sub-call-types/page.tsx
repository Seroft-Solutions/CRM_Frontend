import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { SubCallTypeTable } from './components/sub-call-type-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'SubCallTypes',
};

export default function SubCallTypePage() {
  return (
    <PermissionGuard
      requiredPermission="subCallType:read"
      unauthorizedTitle="Access Denied to Sub Call Types"
      unauthorizedDescription="You don't have permission to view sub call types."
    >
      <div className="space-y-4">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6"
                  />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">Sub Call Types</h1>
                <p className="text-blue-100">Manage your sub call types</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <InlinePermissionGuard requiredPermission="subCallType:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-yellow-400 text-black hover:bg-yellow-500 text-sm font-semibold px-8 shadow-md min-w-32"
                >
                  <Link href="/sub-call-types/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SubCallTypeTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
