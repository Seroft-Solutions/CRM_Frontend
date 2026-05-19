'use client';

import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, PackageCheck } from 'lucide-react';
import { PermissionGuard } from '@/core/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderRecord } from '../../hooks';
import { OrderFulfillmentPanel } from '../../components/order-fulfillment-panel';

interface OrderFulfillmentPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export default function OrderFulfillmentPage({ params, searchParams }: OrderFulfillmentPageProps) {
  const { id: idParam } = use(params);
  const { from } = use(searchParams);
  const id = Number.parseInt(idParam, 10);
  const router = useRouter();
  const navigationSource = from === 'list' ? 'list' : 'order';
  const { orderRecord, isLoading, isError } = useOrderRecord(id, { includeHistory: true });

  return (
    <PermissionGuard
      requiredPermission="sale-order-fulfillment"
      unauthorizedTitle="Access Denied to Order Fulfillment"
      unauthorizedDescription="You don't have permission to manage order fulfillment for this sale order."
    >
      <div className="space-y-6">
        <style
          dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }}
        />
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <PackageCheck className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
            <span className="text-sm font-bold">Order Fulfillment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Link href={`/orders/${id}/fulfillment/history?from=${navigationSource}`}>
                <History className="h-3.5 w-3.5" />
                Fulfillment History
              </Link>
            </Button>
            {navigationSource === 'order' ? (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <Link href={`/orders/${id}`}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back To Order
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();

                    return;
                  }

                  router.push('/orders');
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center">
            {orderRecord ? (
              <Badge className="text-[11px] bg-sidebar-accent text-sidebar-accent-foreground">
                Order #{orderRecord.orderId}
              </Badge>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            Loading sale order fulfillment details...
          </div>
        ) : isError || !orderRecord ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
            Unable to load this sale order for fulfillment.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <OrderFulfillmentPanel order={orderRecord} />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
