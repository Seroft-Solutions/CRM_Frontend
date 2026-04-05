'use client';

import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, History, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderFulfillmentPanel } from '../../components/order-fulfillment-panel';
import { usePurchaseOrderRecord } from '../../hooks';

interface OrderFulfillmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderFulfillmentPage({ params }: OrderFulfillmentPageProps) {
  const { id: idParam } = use(params);
  const id = Number.parseInt(idParam, 10);
  const { orderRecord, isLoading, isError } = usePurchaseOrderRecord(id, {
    includeHistory: true,
  });

  return (
    <div className="space-y-6">
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
              <PackageCheck className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                Purchase Order Fulfillment
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                Receive pending purchase-order quantities and keep fulfillment history in sync.
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
              <Link href={`/purchase-orders/${id}/fulfillment/history`}>
                <History className="h-4 w-4" />
                Fulfillment History
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:from-yellow-600 hover:to-amber-600 hover:border-amber-600"
            >
              <Link href={`/purchase-orders/${id}`}>
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

      {isLoading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
          Loading purchase order fulfillment details...
        </div>
      ) : isError || !orderRecord ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
          Unable to load this purchase order for fulfillment.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <OrderFulfillmentPanel order={orderRecord} />
        </div>
      )}
    </div>
  );
}
