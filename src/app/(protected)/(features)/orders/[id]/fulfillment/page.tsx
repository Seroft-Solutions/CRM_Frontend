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
  const isValidId = Number.isFinite(id) && id > 0;
  const router = useRouter();
  const navigationSource = from === 'list' ? 'list' : 'order';
  const { orderRecord, isLoading, isError } = useOrderRecord(isValidId ? id : 0, {
    includeHistory: true,
  });

  return (
    <PermissionGuard
      requiredPermission="sale-order-fulfillment"
      unauthorizedTitle="Access Denied to Order Fulfillment"
      unauthorizedDescription="You don't have permission to manage order fulfillment for this sale order."
    >
      <div className="min-h-[100dvh] min-w-0 space-y-2 overflow-x-clip bg-slate-100/70 p-2 sm:space-y-3 sm:p-3">
        <style
          dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }}
        />
        <div className="sticky top-0 z-40 rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-white shadow-lg sm:px-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black">Sale Order Fulfillment</div>
                <div className="truncate text-[11px] text-slate-300">
                  Pick, pack, save fulfillment, and review audit records.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 min-[460px]:flex min-[460px]:flex-wrap min-[460px]:items-center lg:justify-end">
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-10 gap-1.5 bg-slate-800 px-2 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white sm:h-8"
              >
                <Link
                  href={`/orders/${isValidId ? id : 0}/fulfillment/history?from=${navigationSource}`}
                >
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  Fulfillment History
                </Link>
              </Button>
              {navigationSource === 'order' ? (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-10 gap-1.5 bg-slate-800 px-2 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white sm:h-8"
                >
                  <Link href={`/orders/${isValidId ? id : 0}`}>
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Back To Order
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 gap-1.5 bg-slate-800 px-2 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white sm:h-8"
                  onClick={() => {
                    if (window.history.length > 1) {
                      router.back();

                      return;
                    }

                    router.push('/orders');
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back
                </Button>
              )}
              {orderRecord ? (
                <Badge className="col-span-2 h-10 justify-center bg-cyan-400 text-[11px] text-slate-950 min-[460px]:h-8 min-[460px]:px-3">
                  Order #{orderRecord.orderId}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {!isValidId ? (
          <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-700 shadow-sm">
            Invalid sale order ID.
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            Loading sale order fulfillment details...
          </div>
        ) : isError || !orderRecord ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
            Unable to load this sale order for fulfillment.
          </div>
        ) : (
          <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <OrderFulfillmentPanel order={orderRecord} />
          </section>
        )}
      </div>
    </PermissionGuard>
  );
}
