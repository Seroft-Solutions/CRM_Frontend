'use client';

import Link from 'next/link';
import { use, useMemo } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetPurchaseOrderFulfillmentGenerations } from '@/core/api/purchase-order-fulfillment-generations';
import { OrderFulfillmentHistoryDetail } from '../../../../components/order-fulfillment-history-detail';
import { getFulfillmentRecordLabel } from '../../../../components/order-fulfillment-utils';
import { usePurchaseOrderRecord } from '../../../../hooks';

interface OrderFulfillmentHistoryDetailPageProps {
  params: Promise<{
    id: string;
    generationId: string;
  }>;
}

export default function OrderFulfillmentHistoryDetailPage({
  params,
}: OrderFulfillmentHistoryDetailPageProps) {
  const { id: idParam, generationId: generationIdParam } = use(params);
  const id = Number.parseInt(idParam, 10);
  const generationId = Number.parseInt(generationIdParam, 10);
  const {
    orderRecord,
    isLoading: orderLoading,
    isError: orderError,
  } = usePurchaseOrderRecord(id, { includeHistory: false });
  const {
    data: generations = [],
    isLoading: generationsLoading,
    isError: generationsError,
  } = useGetPurchaseOrderFulfillmentGenerations(id);

  const generation = useMemo(
    () => generations.find((entry) => entry.id === generationId),
    [generationId, generations]
  );

  return (
    <div className="space-y-6">
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-sm">
              <Eye className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                {generation
                  ? getFulfillmentRecordLabel(id, {
                      invoiceId: generation.id,
                      generationNumber: generation.generationNumber,
                    })
                  : 'Fulfillment Record'}
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                View purchase-order, shipping, and line-item data for this fulfillment invoice.
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
                <ArrowLeft className="h-4 w-4" />
                Back To Fulfillment History
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:from-yellow-600 hover:to-amber-600 hover:border-amber-600"
            >
              <Link href={`/purchase-orders/${id}`}>
                <Eye className="h-4 w-4" />
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
          Loading fulfillment record details...
        </div>
      ) : orderError || generationsError || !orderRecord ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
          Unable to load this fulfillment record.
        </div>
      ) : !generation ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 shadow-sm">
          This fulfillment history record was not found for the selected purchase order.
        </div>
      ) : (
        <OrderFulfillmentHistoryDetail
          order={orderRecord}
          generation={generation}
          generations={generations}
        />
      )}
    </div>
  );
}
