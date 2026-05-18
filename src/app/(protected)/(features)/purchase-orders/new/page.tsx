import { OrderForm } from '../components/form/order-form';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Create Purchase Order',
};

export default function CreateOrderPage() {
  return (
    // <PermissionGuard
    //   requiredPermission="purchase-order:create"
    //   unauthorizedTitle="Access Denied to Create Purchase Order"
    //   unauthorizedDescription="You don't have permission to create new purchase orders."
    // >
    <div className="relative left-1/2 w-[calc(100vw-var(--sidebar-width,16rem)-0.5rem)] max-w-none -translate-x-1/2 space-y-6 group-has-data-[collapsible=icon]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon,3rem)-0.5rem)]">
      <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-sm font-bold">Create Purchase Order</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <OrderForm />
      </div>
    </div>
    // </PermissionGuard>
  );
}
