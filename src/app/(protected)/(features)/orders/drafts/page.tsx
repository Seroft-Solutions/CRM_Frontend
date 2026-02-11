import { Suspense } from 'react';
import { PermissionGuard } from '@/core/auth';
import { OrdersPage } from '@/app/(protected)/(features)/orders/components/orders-page';

export const metadata = {
  title: 'Sale Order Drafts',
};

export default function OrderDraftsRoutePage() {
  return (
    <PermissionGuard
      requiredPermission="order:read"
      unauthorizedTitle="Access Denied to Order Drafts"
      unauthorizedDescription="You don't have permission to view sale order drafts."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <OrdersPage draftOnly />
      </Suspense>
    </PermissionGuard>
  );
}
