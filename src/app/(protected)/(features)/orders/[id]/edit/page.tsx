import { PermissionGuard } from '@/core/auth';
import { OrderEditForm } from '@/app/(protected)/(features)/orders/components/order-edit-form';
import { Edit } from 'lucide-react';

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Order',
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="order:update"
      unauthorizedTitle="Access Denied to Edit Order"
      unauthorizedDescription="You don't have permission to edit order records."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Edit Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Edit className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Edit Order</h1>
                <p className="text-sm text-sidebar-foreground/80">Update order information and status</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <OrderEditForm orderId={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
