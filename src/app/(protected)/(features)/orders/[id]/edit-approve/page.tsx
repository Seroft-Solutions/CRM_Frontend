'use client';

import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { PermissionGuard } from '@/core/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderRecord } from '../../hooks';
import { OrderApprovePanel } from '../../components/order-approve-panel';

interface OrderEditApprovePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export default function OrderEditApprovePage({ params, searchParams }: OrderEditApprovePageProps) {
  const { id: idParam } = use(params);
  const { from } = use(searchParams);
  const id = Number.parseInt(idParam, 10);
  const router = useRouter();
  const navigationSource = from === 'list' ? 'list' : 'order';
  const { orderRecord, isLoading, isError } = useOrderRecord(id, { includeHistory: false });

  return (
    <PermissionGuard
      requiredPermission="order:update"
      unauthorizedTitle="Access Denied to Edit & Approve"
      unauthorizedDescription="You don't have permission to edit and approve this sale order."
    >
      <div className="space-y-6">
        <style dangerouslySetInnerHTML={{ __html: `header:has(nav) { display: none !important; }` }} />
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
            <span className="text-sm font-bold">Edit & Approve Order</span>
          </div>
          <div className="flex items-center gap-1.5">
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
            Loading sale order details...
          </div>
        ) : isError || !orderRecord ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
            Unable to load this sale order for approval.
          </div>
        ) : orderRecord.orderStatus !== 'Created' &&
          orderRecord.orderStatus !== 'Partially Approved' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700 shadow-sm">
            Only orders with "Created" or "Partially Approved" status can be edited and approved.
            Current status: {orderRecord.orderStatus}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <OrderApprovePanel order={orderRecord} />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
