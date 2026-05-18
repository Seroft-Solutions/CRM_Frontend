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
        <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <Undo2 className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
            <span className="text-sm font-bold">Back to Manager</span>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <BackToManagerTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
