'use client';

import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/core/auth';
import { useGetOrderFulfillmentGenerations } from '@/core/api/order-fulfillment-generations';
import { OrderFulfillmentHistoryTable } from '../../../components/order-fulfillment-history-table';
import { useOrderRecord } from '../../../hooks';

interface OrderFulfillmentHistoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export default function OrderFulfillmentHistoryPage({
  params,
  searchParams,
}: OrderFulfillmentHistoryPageProps) {
  const { id: idParam } = use(params);
  const { from } = use(searchParams);
  const id = Number.parseInt(idParam, 10);
  const router = useRouter();
  const navigationSource = from === 'list' ? 'list' : 'order';
  const {
    orderRecord,
    isLoading: orderLoading,
    isError: orderError,
  } = useOrderRecord(id, { includeHistory: false });
  const {
    data: generations = [],
    isLoading: generationsLoading,
    isError: generationsError,
  } = useGetOrderFulfillmentGenerations(id);

  return (
    <PermissionGuard
      requiredPermission="order:read"
      unauthorizedTitle="Access Denied to Fulfillment History"
      unauthorizedDescription="You don't have permission to view order fulfillment history."
    >
      <div className="space-y-6">
        <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <History className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
            <span className="text-sm font-bold">Order Fulfillment History</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Link href={`/orders/${id}/fulfillment?from=${navigationSource}`}>
                <PackageCheck className="h-3.5 w-3.5" />
                Fulfillment
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

        {orderLoading || generationsLoading ? (
          <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            Loading fulfillment history...
          </div>
        ) : orderError || generationsError || !orderRecord ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
            Unable to load fulfillment history for this order.
          </div>
        ) : (
          <OrderFulfillmentHistoryTable order={orderRecord} generations={generations} />
        )}
      </div>
    </PermissionGuard>
  );
}
