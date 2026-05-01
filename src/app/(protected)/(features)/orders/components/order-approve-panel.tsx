'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { OrderDetailItem, OrderRecord } from '../data/order-data';
import { useApproveOrder } from '../api/order-approve';
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';

type ApprovalDraftState = Record<number, { approvedQuantity: string }>;

const parsePositiveInteger = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export function OrderApprovePanel({ order }: { order: OrderRecord }) {
  const [draftState, setDraftState] = useState<ApprovalDraftState>(() => {
    const initialState: ApprovalDraftState = {};
    order.items.forEach((item) => {
      const originalQty = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      initialState[item.orderDetailId] = {
        approvedQuantity: String(originalQty),
      };
    });
    return initialState;
  });

  const { mutateAsync: approveOrder, isPending } = useApproveOrder();
  const { data: warehouseRows = [] } = useWarehousesQuery(
    { page: 0, size: 1000, sort: ['name,asc'], 'status.equals': 'ACTIVE' as const },
    { enabled: true }
  );

  const warehouseNameById = useMemo(
    () =>
      new Map(
        (warehouseRows as IWarehouse[])
          .filter((w): w is IWarehouse & { id: number } => typeof w.id === 'number')
          .map((w) => [w.id, w.name])
      ),
    [warehouseRows]
  );

  const rows = useMemo(() => {
    return order.items.map((item) => {
      const draft = draftState[item.orderDetailId] ?? { approvedQuantity: '0' };
      const originalQty = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const approvedQty = parsePositiveInteger(draft.approvedQuantity);
      const difference = originalQty - approvedQty;

      let validationMessage: string | undefined;
      if (approvedQty > originalQty) {
        validationMessage = `Cannot exceed original quantity (${originalQty})`;
      }

      return {
        item,
        originalQty,
        approvedQty,
        difference,
        validationMessage,
        warehouseName: item.warehouseId ? warehouseNameById.get(item.warehouseId) ?? 'Unknown' : 'Not set',
      };
    });
  }, [order.items, draftState, warehouseNameById]);

  const totalOriginal = rows.reduce((sum, row) => sum + row.originalQty, 0);
  const totalApproved = rows.reduce((sum, row) => sum + row.approvedQty, 0);
  const totalDifference = totalOriginal - totalApproved;
  const hasChanges = rows.some((row) => row.difference !== 0);
  const hasValidationErrors = rows.some((row) => row.validationMessage);

  const updateDraftState = (orderDetailId: number, approvedQuantity: string) => {
    setDraftState((current) => ({
      ...current,
      [orderDetailId]: { approvedQuantity },
    }));
  };

  const handleApprove = async () => {
    if (hasValidationErrors) {
      toast.error('Please fix validation errors before approving');
      return;
    }

    const items = rows
      .filter((row) => row.approvedQty > 0)
      .map((row) => ({
        orderDetailId: row.item.orderDetailId,
        approvedQuantity: row.approvedQty,
      }));

    if (items.length === 0) {
      toast.error('No items to approve');
      return;
    }

    try {
      await approveOrder({
        orderId: order.orderId,
        approveDTO: { items },
      });
      toast.success('Order approved successfully. Excess quantities added back to stock.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700">{totalOriginal}</div>
          <div className="text-xs text-muted-foreground">Original Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalApproved}</div>
          <div className="text-xs text-muted-foreground">Approved Total</div>
        </div>
        <div className="text-center">
          <div className={cn('text-2xl font-bold', totalDifference > 0 ? 'text-emerald-600' : 'text-slate-700')}>
            {totalDifference}
          </div>
          <div className="text-xs text-muted-foreground">Returning to Stock</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold text-center">SKU</TableHead>
              <TableHead className="font-semibold text-center">Variant</TableHead>
              <TableHead className="font-semibold text-center">Warehouse</TableHead>
              <TableHead className="font-semibold text-center">Original Qty</TableHead>
              <TableHead className="font-semibold text-center">Approve Qty</TableHead>
              <TableHead className="font-semibold text-center">Returning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.item.orderDetailId} className="hover:bg-slate-50/70">
                <TableCell>
                  <div className="font-medium text-slate-900">{row.item.productName || 'Unknown'}</div>
                </TableCell>
                <TableCell className="text-center text-sm text-slate-600">{row.item.sku || '—'}</TableCell>
                <TableCell className="text-center text-sm text-slate-600">
                  {row.item.variantAttributes || '—'}
                </TableCell>
                <TableCell className="text-center text-sm text-slate-600">{row.warehouseName}</TableCell>
                <TableCell className="text-center font-semibold text-slate-700">{row.originalQty}</TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={row.originalQty}
                    value={draftState[row.item.orderDetailId]?.approvedQuantity ?? '0'}
                    onChange={(e) => updateDraftState(row.item.orderDetailId, e.target.value)}
                    className={cn(
                      'w-20 text-center',
                      row.validationMessage ? 'border-red-500 focus-visible:ring-red-500' : ''
                    )}
                  />
                  {row.validationMessage ? (
                    <div className="mt-1 text-xs text-red-600">{row.validationMessage}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn('font-semibold', row.difference > 0 ? 'text-emerald-600' : 'text-slate-500')}>
                    {row.difference > 0 ? `+${row.difference}` : row.difference}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          asChild
          className="gap-2"
        >
          <Link href={`/orders/${order.orderId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Order
          </Link>
        </Button>

        <Button
          onClick={handleApprove}
          disabled={isPending || hasValidationErrors || !hasChanges}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle className="h-4 w-4" />
          {isPending ? 'Approving...' : 'Approve Order'}
        </Button>
      </div>
    </div>
  );
}
