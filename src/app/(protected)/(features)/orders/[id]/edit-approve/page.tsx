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
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 shadow-sm">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">
                  Edit & Approve Order
                </h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Review and adjust quantities before approving. Excess quantities will be returned
                  to stock.
                </p>
              </div>
            </div>

            <div className="flex flex-1 justify-center gap-2">
              {navigationSource === 'order' ? (
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
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:from-yellow-600 hover:to-amber-600 hover:border-amber-600"
                  onClick={() => {
                    if (window.history.length > 1) {
                      router.back();

                      return;
                    }
                    router.push('/orders');
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
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
