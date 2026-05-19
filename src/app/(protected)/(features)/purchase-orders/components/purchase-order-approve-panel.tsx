'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { OrderRecord } from '../data/purchase-order-data';
import { useApprovePurchaseOrder } from '../api/purchase-order-approve';

type ApprovalDraftState = Record<number, { approvedQuantity: string }>;

const itemStatusColors: Record<string, string> = {
  Created: 'bg-amber-100 text-amber-800 border-amber-300',
  Approved: 'bg-lime-100 text-lime-800 border-lime-300',
  Recived: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Cancel: 'bg-slate-100 text-slate-800 border-slate-300',
};

const parsePositiveInteger = (value: string) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export function PurchaseOrderApprovePanel({ order }: { order: OrderRecord }) {
  const router = useRouter();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => new Set());
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

  const { mutateAsync: approveOrder, isPending } = useApprovePurchaseOrder();

  const rows = useMemo(() => {
    return order.items
      .filter((item) => !item.itemStatusCode || item.itemStatusCode === 'CREATED')
      .map((item) => {
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
        };
      });
  }, [order.items, draftState]);

  const totalOriginal = rows.reduce((sum, row) => sum + row.originalQty, 0);
  const totalApproved = rows.reduce((sum, row) => sum + row.approvedQty, 0);
  const totalDifference = totalOriginal - totalApproved;
  const hasValidationErrors = rows.some((row) => row.validationMessage);
  const allRowsSelected =
    rows.length > 0 && rows.every((row) => selectedItemIds.has(row.item.orderDetailId));
  const selectedRows = rows.filter((row) => selectedItemIds.has(row.item.orderDetailId));
  const allItemsWillBeApprovedBySelected =
    selectedRows.length > 0 &&
    order.items.every(
      (item) => item.itemStatusCode === 'APPROVED' || selectedItemIds.has(item.orderDetailId)
    );
  const selectedResultingStatus = allItemsWillBeApprovedBySelected
    ? 'Approved'
    : 'PartiallyApproved';

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

    const items = selectedRows.map((row) => ({
      orderDetailId: row.item.orderDetailId,
      approvedQuantity: row.approvedQty,
    }));

    if (items.length === 0) {
      toast.error('Select at least one item to approve');

      return;
    }

    try {
      await approveOrder({
        orderId: order.orderId,
        approveDTO: { items },
      });
      toast.success('Selected items approved successfully.');
      router.push('/purchase-orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve selected items');
    }
  };

  const handleBulkApproveAll = async () => {
    if (hasValidationErrors) {
      toast.error('Please fix validation errors before approving');

      return;
    }

    const items = rows.map((row) => ({
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
      toast.success('All items approved successfully.');
      router.push('/purchase-orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve all items');
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedItemIds(checked ? new Set(rows.map((row) => row.item.orderDetailId)) : new Set());
  };

  const toggleSelectedItem = (orderDetailId: number, checked: boolean) => {
    setSelectedItemIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(orderDetailId);
      } else {
        next.delete(orderDetailId);
      }

      return next;
    });
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
          <div
            className={cn(
              'text-2xl font-bold',
              totalDifference > 0 ? 'text-emerald-600' : 'text-slate-700'
            )}
          >
            {totalDifference}
          </div>
          <div className="text-xs text-muted-foreground">Returning to Stock</div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Resulting Status:</span>
          <Badge
            className={cn(
              selectedResultingStatus === 'Approved'
                ? 'bg-lime-100 text-lime-900'
                : 'bg-orange-100 text-orange-900'
            )}
          >
            Approve Selected: {selectedRows.length > 0 ? selectedResultingStatus : 'Select items'}
          </Badge>
          <Badge className="bg-lime-100 text-lime-900">Bulk Approve All: Approved</Badge>
        </div>
        {selectedRows.length > 0 && selectedResultingStatus === 'PartiallyApproved' ? (
          <p className="mt-2 text-xs">
            Approving only selected items will set the order status to PartiallyApproved. You can
            approve remaining items later.
          </p>
        ) : null}
      </div>

      {/* Items Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={allRowsSelected}
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                  aria-label="Select all order items"
                />
              </TableHead>
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold text-center">SKU</TableHead>
              <TableHead className="font-semibold text-center">Variant</TableHead>
              <TableHead className="font-semibold text-center">Item Status</TableHead>
              <TableHead className="font-semibold text-center">Original Qty</TableHead>
              <TableHead className="font-semibold text-center">Approve Qty</TableHead>
              <TableHead className="font-semibold text-center">Returning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  No items are available for approval.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((row) => {
              const isSelected = selectedItemIds.has(row.item.orderDetailId);

              return (
                <TableRow
                  key={row.item.orderDetailId}
                  className={cn('hover:bg-slate-50/70', isSelected && 'bg-emerald-50/60')}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleSelectedItem(row.item.orderDetailId, checked === true)
                      }
                      aria-label={`Select ${row.item.productName || row.item.sku || 'order item'}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {row.item.productName || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-600">
                    {row.item.sku || '—'}
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-600">
                    {row.item.variantAttributes || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-2 font-semibold',
                        itemStatusColors[row.item.itemStatus] ??
                          'bg-slate-100 text-slate-800 border-slate-300'
                      )}
                    >
                      {row.item.itemStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">
                    {row.originalQty}
                  </TableCell>
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
                    <span
                      className={cn(
                        'font-semibold',
                        row.difference > 0 ? 'text-emerald-600' : 'text-slate-500'
                      )}
                    >
                      {row.difference > 0 ? `+${row.difference}` : row.difference}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild className="gap-2">
          <Link href={`/purchase-orders/${order.orderId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Purchase Order
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleBulkApproveAll}
            disabled={isPending || hasValidationErrors || rows.length === 0}
            variant="outline"
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? 'Approving...' : 'Bulk Approve All'}
          </Button>

          <Button
            onClick={handleApprove}
            disabled={isPending || hasValidationErrors || selectedRows.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? 'Approving...' : 'Approve Selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}
