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
  const isValidId = Number.isFinite(id) && id > 0;
  const { orderRecord, isLoading, isError } = usePurchaseOrderRecord(isValidId ? id : 0, {
    includeHistory: true,
  });

  // TODO: Add PermissionGuard when a purchase-order-fulfillment authority is defined in roles-by-group.
  return (
    <main className="min-h-[calc(100dvh-1rem)] space-y-3 bg-slate-100/70 p-2 sm:p-3">
      <style
        dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }}
      />
      <div className="sticky top-0 z-30 flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white shadow-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2.5 sm:mr-auto">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">Purchase Order Receiving</p>
            <p className="truncate text-[11px] text-slate-400">
              Receive vendor shipments against purchase order lines
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {orderRecord ? (
            <Badge className="bg-emerald-400 text-[11px] text-slate-950">
              Order #{orderRecord.orderId}
            </Badge>
          ) : null}
          <Button
            asChild
            variant="ghost"
            className="h-8 gap-1.5 px-2.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Link href={`/purchase-orders/${isValidId ? id : ''}/fulfillment/history`}>
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              Receiving History
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-8 gap-1.5 px-2.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Link href={isValidId ? `/purchase-orders/${id}` : '/purchase-orders'}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back To Order
            </Link>
          </Button>
        </div>
      </div>

      {!isValidId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm font-medium text-amber-800 shadow-sm">
          Invalid purchase order ID.
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
          Loading purchase order receiving details…
        </div>
      ) : isError || !orderRecord ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
          Unable to load this purchase order for receiving.
        </div>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <OrderFulfillmentPanel order={orderRecord} />
        </section>
      )}
    </main>
  );
}
