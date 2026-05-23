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
    <main
      data-fulfillment-full-width
      className="min-h-[100dvh] w-full max-w-none min-w-0 space-y-2 overflow-x-clip bg-slate-100/70 p-2 sm:space-y-3 sm:p-3"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header:has(nav) { display: none !important; }
            .container:has([data-fulfillment-full-width]) {
              width: 100% !important;
              max-width: none !important;
              margin-inline: 0 !important;
              min-width: 0 !important;
            }
          `,
        }}
      />
      <div className="sticky top-0 z-30 flex min-w-0 flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-white shadow-sm sm:flex-row sm:items-center sm:px-3">
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
        <div className="grid grid-cols-2 gap-1.5 min-[460px]:flex min-[460px]:flex-wrap min-[460px]:items-center">
          {orderRecord ? (
            <Badge className="col-span-2 justify-center bg-emerald-400 text-[11px] text-slate-950 min-[460px]:col-span-1">
              Order #{orderRecord.orderId}
            </Badge>
          ) : null}
          <Button
            asChild
            variant="ghost"
            className="h-10 min-w-0 gap-1.5 px-2.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-8"
          >
            <Link href={`/purchase-orders/${isValidId ? id : ''}/fulfillment/history`}>
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              Receiving History
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-10 min-w-0 gap-1.5 px-2.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-8"
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
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <OrderFulfillmentPanel order={orderRecord} />
        </section>
      )}
    </main>
  );
}
