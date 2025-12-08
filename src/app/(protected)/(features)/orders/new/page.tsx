import { PermissionGuard } from '@/core/auth';
import { OrderForm } from '@/app/(protected)/(features)/orders/components/order-form';

export const metadata = {
  title: 'Create Order',
};

export default function CreateOrderPage() {
  return (
    // <PermissionGuard
    //   requiredPermission="order:create"
    //   unauthorizedTitle="Access Denied to Create Order"
    //   unauthorizedDescription="You don't have permission to create new orders."
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Create Order</h1>
              <p className="text-blue-100">Capture the essentials for a new order record.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <OrderForm />
        </div>
      </div>
    // </PermissionGuard>
  );
}
