import { PermissionGuard } from '@/core/auth';
import { OrderHistoryTable } from '@/app/(protected)/(features)/orders/components/order-history-table';
import { mockOrders } from '@/app/(protected)/(features)/orders/data/mock-orders';

export const metadata = {
  title: 'Order History',
};

export default function OrderHistoryPage() {
  return (
    // <PermissionGuard
    //   requiredPermission="order:read"
    //   unauthorizedTitle="Access Denied to Order History"
    //   unauthorizedDescription="You don't have permission to view order history."
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
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Order History</h1>
              <p className="text-blue-100">Audit every status change across orders and items.</p>
            </div>
          </div>
        </div>

        <OrderHistoryTable orders={mockOrders} />
      </div>
    // </PermissionGuard>
  );
}
