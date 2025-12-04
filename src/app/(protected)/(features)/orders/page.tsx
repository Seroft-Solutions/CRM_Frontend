import { Suspense } from 'react';
import { PermissionGuard } from '@/core/auth';
import { OrdersPage } from '@/app/(protected)/(features)/orders/components/orders-page';

export const metadata = {
  title: 'Orders',
};

export default function OrdersRoutePage() {
  return (
    // <PermissionGuard
    //   requiredPermission="order:read"
    //   unauthorizedTitle="Access Denied to Orders"
    //   unauthorizedDescription="You don't have permission to view orders."
    // >
      <Suspense fallback={<div>Loading...</div>}>
        <OrdersPage />
      </Suspense>
    // </PermissionGuard>
  );
}
