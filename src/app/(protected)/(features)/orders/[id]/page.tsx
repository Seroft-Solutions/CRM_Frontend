import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/core/auth';
import { OrderDetail } from '@/app/(protected)/(features)/orders/components/order-detail';
import { mockOrders } from '@/app/(protected)/(features)/orders/data/mock-orders';
import { Eye, ArrowDownToLine, ArrowLeft, Edit } from 'lucide-react';

interface OrderPageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const { id: idParam } = params;
  const id = parseInt(idParam, 10);
  const order = mockOrders.find((item) => item.orderId === id);

  return (
    // <PermissionGuard
    //   requiredPermission="order:read"
    //   unauthorizedTitle="Access Denied to Order Details"
    //   unauthorizedDescription="You don't have permission to view this order."
    // >
      <div className="space-y-6">
        {/* Modern Centered Header for View Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Order #{idParam}</h1>
                <p className="text-sm text-sidebar-foreground/80">View order details and history</p>
              </div>
            </div>

            {/* Center Section: Action Buttons */}
            <div className="flex-1 flex justify-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-2 bg-sidebar-accent/10 text-sidebar-accent-foreground border-sidebar-accent/20 hover:bg-sidebar-accent/20">
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90">
                <Link href={`/orders/${id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        {order ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <OrderDetail order={order} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-muted-foreground">
            Order not found in mock data. Adjust the mockOrders dataset to include this id.
          </div>
        )}
      </div>
    // </PermissionGuard>
  );
}
