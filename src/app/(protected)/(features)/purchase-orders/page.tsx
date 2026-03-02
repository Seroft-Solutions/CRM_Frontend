import { Suspense } from 'react';
import { PermissionGuard } from '@/core/auth';
import { OrdersPage } from './components/orders-page';

export const metadata = {
  title: 'Purchase Orders',
};

export default function PurchaseOrdersRoutePage() {
  return (
    // <PermissionGuard
    //   requiredPermission="purchase-order:read"
    //   unauthorizedTitle="Access Denied to Purchase Orders"
    //   unauthorizedDescription="You don't have permission to view purchase orders."
    // >
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPage />
    </Suspense>
    // </PermissionGuard>
  );
}
