import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { SystemConfigTable } from './components/system-config-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'System Configs',
};

export default function SystemConfigPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfig:read"
      unauthorizedTitle="Access Denied to System Configs"
      unauthorizedDescription="You don't have permission to view system configs."
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">System Configs</h1>
                <p className="text-blue-100">Manage your system configurations</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <InlinePermissionGuard requiredPermission="systemConfig:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-yellow-400 text-black hover:bg-yellow-500 text-sm font-semibold px-8 shadow-md min-w-32"
                >
                  <Link href="/system-configs/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SystemConfigTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
