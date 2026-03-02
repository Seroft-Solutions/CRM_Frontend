import { Suspense } from 'react';
import { PermissionGuard } from '@/core/auth';
import { OrdersPage } from '../components/orders-page';

export const metadata = {
  title: 'Purchase Order Drafts',
};

export default function PurchaseOrderDraftsRoutePage() {
  return (
    <PermissionGuard
      requiredPermission="purchase-order:read"
      unauthorizedTitle="Access Denied to Purchase Order Drafts"
      unauthorizedDescription="You don't have permission to view purchase order drafts."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <OrdersPage draftOnly />
      </Suspense>
    </PermissionGuard>
  );
}
