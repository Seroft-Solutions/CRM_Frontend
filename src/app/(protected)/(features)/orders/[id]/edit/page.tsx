import { PermissionGuard } from '@/core/auth';
import { OrderForm } from '@/app/(protected)/(features)/orders/components/order-form';
import { mockOrders } from '@/app/(protected)/(features)/orders/data/mock-orders';

interface EditOrderPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Edit Order',
};

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const { id: idParam } = params;
  const id = parseInt(idParam, 10);
  const order = mockOrders.find((item) => item.orderId === id);

  return (
    // <PermissionGuard
    //   requiredPermission="order:update"
    //   unauthorizedTitle="Access Denied to Edit Order"
    //   unauthorizedDescription="You don't have permission to edit order records."
    // >
      <div className="space-y-6">
        <div className="feature-header bg-[oklch(0.45_0.06_243)] relative overflow-hidden rounded-lg p-6 shadow-lg">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Edit Order</h1>
              <p className="text-blue-100">Update the status, fulfillment, or payment details.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {order ? (
            <OrderForm initialOrder={order} />
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
              Order not found in mock data. Update mockOrders to edit this record.
            </div>
          )}
        </div>
      </div>
    // </PermissionGuard>
  );
}
