import { PermissionGuard } from '@/core/auth';
import { OrderForm } from '@/app/(protected)/(features)/orders/components/form/order-form';
import { Plus } from 'lucide-react';
import { Suspense } from 'react';

export const metadata = {
  title: 'Create Sale Order',
};

interface CreateOrderPageProps {
  searchParams: Promise<{ callId?: string; customerId?: string }>;
}

export default async function CreateOrderPage({ searchParams }: CreateOrderPageProps) {
  const params = await searchParams;
  const callId = params.callId ? parseInt(params.callId, 10) : undefined;
  const customerId = params.customerId ? parseInt(params.customerId, 10) : undefined;

  return (
    <PermissionGuard
      requiredPermission="order:create"
      unauthorizedTitle="Access Denied to Create Order"
      unauthorizedDescription="You don't have permission to create new orders."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Create Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Create Sale Order</h1>
                <p className="text-sm text-sidebar-foreground/80">Add a new order to the system</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<div>Loading...</div>}>
            <OrderForm callId={callId} customerId={customerId} />
          </Suspense>
        </div>
      </div>
    </PermissionGuard>
  );
}
