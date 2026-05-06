import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { PermissionGuard } from '@/core/auth';
import { Button } from '@/components/ui/button';
import { OrderEditForm } from '../../components/form/order-edit-form';

interface PurchaseOrderEditApprovePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit & Approve Purchase Order',
};

export default async function PurchaseOrderEditApprovePage({
  params,
}: PurchaseOrderEditApprovePageProps) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="purchase-order:update"
      unauthorizedTitle="Access Denied to Edit & Approve Purchase Order"
      unauthorizedDescription="You don't have permission to edit and approve purchase order records."
    >
      <div className="space-y-6">
        <div className="rounded-md border border-sidebar-border bg-sidebar p-4 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 shadow-sm">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">
                  Edit & Approve Purchase Order
                </h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Review purchase items, update status, and save approval changes.
                </p>
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 border-yellow-500 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-sm hover:border-amber-600 hover:from-yellow-600 hover:to-amber-600"
              >
                <Link href={`/purchase-orders/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back To Purchase Order
                </Link>
              </Button>
            </div>

            <div className="flex-1" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <OrderEditForm orderId={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
