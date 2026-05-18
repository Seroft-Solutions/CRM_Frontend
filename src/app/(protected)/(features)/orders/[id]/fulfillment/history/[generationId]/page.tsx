'use client';

import Link from 'next/link';
import { use, useMemo } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/core/auth';
import { useGetOrderFulfillmentGenerations } from '@/core/api/order-fulfillment-generations';
import { OrderFulfillmentHistoryDetail } from '../../../../components/order-fulfillment-history-detail';
import { getFulfillmentRecordLabel } from '../../../../components/order-fulfillment-utils';
import { useOrderRecord } from '../../../../hooks';

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
  } = useOrderRecord(id, { includeHistory: false });
  const {
    data: generations = [],
    isLoading: generationsLoading,
    isError: generationsError,
  } = useGetOrderFulfillmentGenerations(id);

  const generation = useMemo(
    () => generations.find((entry) => entry.id === generationId),
    [generationId, generations]
  );

  return (
    <PermissionGuard
      requiredPermission="order:read"
      unauthorizedTitle="Access Denied to Fulfillment Record"
      unauthorizedDescription="You don't have permission to view this fulfillment record."
    >
      <div className="space-y-6">
        <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
            <span className="text-sm font-bold">
              {generation
                ? getFulfillmentRecordLabel(id, {
                    invoiceId: generation.id,
                    generationNumber: generation.generationNumber,
                  })
                : 'Fulfillment Record'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Link href={`/orders/${id}/fulfillment/history`}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back To Fulfillment History
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Link href={`/orders/${id}`}>
                <Eye className="h-3.5 w-3.5" />
                Back To Order
              </Link>
            </Button>
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
            Loading fulfillment record details...
          </div>
        ) : orderError || generationsError || !orderRecord ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
            Unable to load this fulfillment record.
          </div>
        ) : !generation ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 shadow-sm">
            This fulfillment history record was not found for the selected order.
          </div>
        ) : (
          <OrderFulfillmentHistoryDetail
            order={orderRecord}
            generation={generation}
            generations={generations}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
