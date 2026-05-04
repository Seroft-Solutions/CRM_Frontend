import { Suspense } from 'react';
import { Undo2 } from 'lucide-react';
import { PermissionGuard } from '@/core/auth';
import { BackToManagerTable } from './components/table/back-to-manager-table';

export const metadata = {
  title: 'Back to Manager',
};

export default function BackToManagerPage() {
  return (
    <PermissionGuard
      requiredPermission="sale-order-fulfillment"
      unauthorizedTitle="Access Denied to Back to Manager"
      unauthorizedDescription="You don't have permission to review fulfillment issues."
    >
      <div className="space-y-4">
        <div className="rounded-md border border-sidebar-border bg-sidebar p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
              <Undo2 className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Back to Manager</h1>
              <p className="text-sm text-sidebar-foreground/80">
                Review sale order items returned from fulfillment.
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <BackToManagerTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
