import { OrderEditForm } from '../../components/form/order-edit-form';
import { Edit } from 'lucide-react';

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Purchase Order',
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    // <PermissionGuard
    //   requiredPermission="purchase-order:update"
    //   unauthorizedTitle="Access Denied to Edit Purchase Order"
    //   unauthorizedDescription="You don't have permission to edit purchase order records."
    // >
    <div className="relative left-1/2 w-[calc(100vw-var(--sidebar-width,16rem)-0.5rem)] max-w-none -translate-x-1/2 space-y-6 group-has-data-[collapsible=icon]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon,3rem)-0.5rem)]">
      <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
            <Edit className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-sm font-bold">Edit Purchase Order</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <OrderEditForm orderId={id} />
      </div>
    </div>
    // </PermissionGuard>
  );
}
