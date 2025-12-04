'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/core/auth';
import { OrderDetail } from '@/app/(protected)/(features)/orders/components/order-detail';
import { mockOrders } from '@/app/(protected)/(features)/orders/data/mock-orders';

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const { id: idParam } = use(params);
  const id = parseInt(idParam, 10);
  const order = mockOrders.find((item) => item.orderId === id);

  return (
    // <PermissionGuard
    //   requiredPermission="order:read"
    //   unauthorizedTitle="Access Denied to Order Details"
    //   unauthorizedDescription="You don't have permission to view this order."
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

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 4 9-4m-9 13V11" />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">Order #{idParam}</h1>
                <p className="text-blue-100">History, item breakdown, and address details.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="bg-white/10 text-white">
                <Link href="/orders">Back</Link>
              </Button>
              <Button asChild size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Link href={`/orders/${id}/edit`}>Edit</Link>
              </Button>
            </div>
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
