'use client';

import Link from 'next/link';
import { use, useMemo } from 'react';
import { ArrowLeft, Eye, PackageCheck } from 'lucide-react';
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
                  View customer, order, shipping, discount, and line item data for this fulfillment
                  history entry.
                </p>
              </div>
            </div>

            <div className="flex flex-1 justify-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 bg-sidebar-accent/10 text-sidebar-accent-foreground border-sidebar-accent/20 hover:bg-sidebar-accent/20"
              >
                <Link href={`/orders/${id}/fulfillment/history`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back To History
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 bg-sidebar-accent/10 text-sidebar-accent-foreground border-sidebar-accent/20 hover:bg-sidebar-accent/20"
              >
                <Link href={`/orders/${id}/fulfillment`}>
                  <PackageCheck className="h-4 w-4" />
                  Fulfillment
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
            This fulfillment history record was not found for the selected order.
          </div>
        ) : (
          <OrderFulfillmentHistoryDetail order={orderRecord} generation={generation} />
        )}
      </div>
    </PermissionGuard>
  );
}
