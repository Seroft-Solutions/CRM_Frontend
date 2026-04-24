import { PermissionGuard } from '@/core/auth';
import { OrderEditForm } from '@/app/(protected)/(features)/orders/components/form/order-edit-form';

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
      <div className="relative left-1/2 w-[calc(100vw-var(--sidebar-width,16rem)-2rem)] max-w-none -translate-x-1/2">
        <OrderEditForm orderId={id} />
      </div>
    </PermissionGuard>
  );
}
