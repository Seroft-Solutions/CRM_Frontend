import { Suspense } from 'react';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';

import { WarehouseTable } from './components/warehouse-table';

export const metadata = {
  title: 'Warehouses',
};

export default function WarehousePage() {
  return (
    <PermissionGuard
      requiredPermission="warehouse:read"
      unauthorizedTitle="Access Denied to Warehouses"
      unauthorizedDescription="You do not have permission to view warehouses."
    >
      <div className="space-y-4">
        <div className="rounded-md border border-sidebar-border bg-sidebar p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
                <Building2 className="h-4 w-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Warehouses</h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Manage storage locations and capacity
                </p>
              </div>
            </div>

            <InlinePermissionGuard requiredPermission="warehouse:create">
              <Button asChild size="sm" className="h-9 gap-2 px-4">
                <Link href="/warehouses/new">
                  <Plus className="h-4 w-4" />
                  New Warehouse
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <WarehouseTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
