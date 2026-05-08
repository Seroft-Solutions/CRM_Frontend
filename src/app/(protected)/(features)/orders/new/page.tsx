import { PermissionGuard } from '@/core/auth';
import { OrderForm } from '@/app/(protected)/(features)/orders/components/form/order-form';
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
      <div className="relative left-1/2 w-[calc(100vw-var(--sidebar-width,16rem)-0.5rem)] max-w-none -translate-x-1/2 group-has-data-[collapsible=icon]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon,3rem)-0.5rem)]">
        <Suspense fallback={<div>Loading...</div>}>
          <OrderForm callId={callId} customerId={customerId} />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
