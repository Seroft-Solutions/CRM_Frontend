'use client';

import Link from 'next/link';
import { use } from 'react';
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
}

export default function OrderFulfillmentHistoryPage({ params }: OrderFulfillmentHistoryPageProps) {
  const { id: idParam } = use(params);
  const id = Number.parseInt(idParam, 10);
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
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
                <History className="h-4 w-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">
                  Order Fulfillment History
                </h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Review every saved fulfillment record for this sale order.
                </p>
              </div>
            </div>

            <div className="flex flex-1 justify-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:from-yellow-600 hover:to-amber-600 hover:border-amber-600"
              >
                <Link href={`/orders/${id}/fulfillment`}>
                  <PackageCheck className="h-4 w-4" />
                  Fulfillment
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:from-yellow-600 hover:to-amber-600 hover:border-amber-600"
              >
                <Link href={`/orders/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back To Order
                </Link>
              </Button>
            </div>

            <div className="flex flex-1 justify-end">
              {orderRecord ? (
                <Badge className="bg-sidebar-accent text-sidebar-accent-foreground">
                  Order #{orderRecord.orderId}
                </Badge>
              ) : null}
            </div>
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
