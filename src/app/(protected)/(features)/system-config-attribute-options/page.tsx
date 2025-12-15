import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { SystemConfigAttributeOptionTable } from './components/system-config-attribute-option-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Attribute Options',
};

export default function SystemConfigAttributeOptionPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:read"
      unauthorizedTitle="Access Denied to Attribute Options"
      unauthorizedDescription="You don't have permission to view attribute options."
    >
      <div className="space-y-4">
        {/* Professional Header with Dotted Background */}
        <div className="feature-header bg-[oklch(0.45_0.06_243)] rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 relative z-10">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">Attribute Options</h1>
                <p className="text-blue-100">Manage attribute option values</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-yellow-400 text-black hover:bg-yellow-500 text-sm font-semibold px-8 shadow-md min-w-32"
                >
                  <Link href="/system-config-attribute-options/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SystemConfigAttributeOptionTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
