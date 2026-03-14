import { Building2 } from 'lucide-react';

import { PermissionGuard } from '@/core/auth';

import { WarehouseForm } from '../components/warehouse-form';

export const metadata = {
  title: 'Create Warehouse',
};

export default function CreateWarehousePage() {
  return (
    <PermissionGuard
      requiredPermission="warehouse:create"
      unauthorizedTitle="Access Denied to Create Warehouse"
      unauthorizedDescription="You do not have permission to create warehouses."
    >
      <div className="space-y-6">
        <div className="rounded-md border border-sidebar-border bg-sidebar p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
              <Building2 className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Create Warehouse</h1>
              <p className="text-sm text-sidebar-foreground/80">Add a new warehouse record</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <WarehouseForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
