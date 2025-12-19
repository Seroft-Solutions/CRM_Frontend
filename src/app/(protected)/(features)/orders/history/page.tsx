import { PermissionGuard } from '@/core/auth';
import { OrderHistoryTable } from '@/app/(protected)/(features)/orders/components/order-history-table';
import { mockOrders } from '@/app/(protected)/(features)/orders/data/mock-orders';
import { History, ArrowDownToLine } from 'lucide-react';

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
        {/* Modern Centered Header for History Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <History className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Order History</h1>
                <p className="text-sm text-sidebar-foreground/80">Track order status changes and updates</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <OrderHistoryTable orders={mockOrders} />
      </div>
    // </PermissionGuard>
  );
}
