'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderDetailContainer } from '@/app/(protected)/(features)/orders/components/order-detail-container';
import { CheckCircle, ArrowLeft, Edit } from 'lucide-react';
import { useState, use } from 'react';
import { OrderRecord } from '../data/order-data';
import { InvoicePrintButton } from '@/components/invoice/InvoicePrintButton';
import { PermissionGuard } from '@/core/auth';

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const { id: idParam } = use(params);
  const id = parseInt(idParam, 10);
  const [orderData, setOrderData] = useState<OrderRecord | null>(null);

  return (
    <PermissionGuard
      requiredPermission="order:read"
      unauthorizedTitle="Access Denied to Order Details"
      unauthorizedDescription="You don't have permission to view this order."
    >
      <div className="so-detail-page -m-4 flex flex-col min-h-[calc(100vh-12px)]">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* SO detail: hide breadcrumb header, remove parent padding */
          .so-detail-page { margin: -16px; }
          header:has(nav) { display: none !important; }
          .so-detail-page ~ *, .so-detail-page { max-width: 100% !important; }
        `,
          }}
        />
        <OrderDetailContainer
          orderId={id}
          onOrderLoaded={setOrderData}
          headerSlot={
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5 mr-auto">
                <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
                  <span className="text-xs font-black text-sidebar-accent-foreground">SO</span>
                </div>
                <div className="leading-tight">
                  <span className="text-sm font-bold">#{idParam}</span>
                  <span className="text-[11px] text-slate-400 ml-2">Sale Order</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-[11px] gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Link href="/orders">
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </Link>
                </Button>
                {orderData &&
                  ['Created', 'Partially Approved', 'Pending'].includes(orderData.orderStatus) && (
                    <Button
                      asChild
                      size="sm"
                      className="h-7 px-2.5 text-[11px] gap-1.5 bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground border-0"
                    >
                      <Link href={`/orders/${id}/edit-approve?from=order`}>
                        <CheckCircle className="h-3 w-3" />
                        Approve
                      </Link>
                    </Button>
                  )}
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-[11px] gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Link href={`/orders/${id}/edit`}>
                    <Edit className="h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                {orderData && (
                  <div className="[&_button]:bg-transparent [&_button]:border-slate-600 [&_button]:text-slate-300 [&_button]:hover:bg-slate-800 [&_button]:hover:text-white [&_button]:h-7 [&_button]:px-2.5 [&_button]:text-[11px]">
                    <InvoicePrintButton order={orderData} orderType="sales" />
                  </div>
                )}
              </div>
            </div>
          }
        />
      </div>
    </PermissionGuard>
  );
}
