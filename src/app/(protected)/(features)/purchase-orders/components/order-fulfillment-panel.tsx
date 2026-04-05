'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, History, Pencil, PackageCheck, RefreshCcw, Sparkles } from 'lucide-react';
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
import {
  useCreatePurchaseOrderFulfillmentGeneration,
  useGetPurchaseOrderFulfillmentGenerations,
} from '@/core/api/purchase-order-fulfillment-generations';
import type { OrderDetailItem, OrderRecord } from '../data/purchase-order-data';
import { useOrderFulfillmentStocks } from '../hooks/use-order-fulfillment-stocks';
import { formatOrderDateTime, getFulfillmentRecordLabel } from './order-fulfillment-utils';

type FulfillmentDraftState = Record<number, { selected: boolean; quantity: string }>;

const parsePositiveInteger = (value: string) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as { response?: { data?: { message?: string; title?: string } } };

    return (
      maybeResponse.response?.data?.message ||
      maybeResponse.response?.data?.title ||
      'Unable to save purchase order fulfillment.'
    );
  }

  return 'Unable to save purchase order fulfillment.';
};

const createInitialDraftState = (items: OrderDetailItem[]): FulfillmentDraftState =>
  Object.fromEntries(
    items
      .filter((item) => Math.max(0, item.quantity) > 0)
      .map((item) => [item.orderDetailId, { selected: false, quantity: '' }])
  );

export function OrderFulfillmentPanel({ order }: { order: OrderRecord }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftState, setDraftState] = useState<FulfillmentDraftState>(() =>
    createInitialDraftState(order.items)
  );
  const allItems = useMemo(() => order.items, [order.items]);
  const pendingItems = useMemo(
    () => order.items.filter((item) => Math.max(0, item.quantity) > 0),
    [order.items]
  );
  const completedItemsCount = useMemo(
    () => allItems.filter((item) => Math.max(0, item.quantity) === 0).length,
    [allItems]
  );
  const totalPendingUnits = useMemo(
    () => pendingItems.reduce((sum, item) => sum + Math.max(0, item.quantity), 0),
    [pendingItems]
  );

  const { stockByItemId, isLoading: stocksLoading } = useOrderFulfillmentStocks(order.items);
  const { data: generations = [], isLoading: generationsLoading } =
    useGetPurchaseOrderFulfillmentGenerations(order.orderId);
  const { mutateAsync: createGeneration, isPending: isGenerating } =
    useCreatePurchaseOrderFulfillmentGeneration();

  useEffect(() => {
    setDraftState(createInitialDraftState(order.items));
    setIsEditing(false);
  }, [order.items]);

  const receivedQuantityByOrderDetailId = useMemo(() => {
    const receivedMap = new Map<number, number>();

    generations.forEach((generation) => {
      generation.items?.forEach((item) => {
        if (typeof item.orderDetailId !== 'number') {
          return;
        }

        const receivedQuantity = Math.max(0, item.deliveredQuantity ?? 0);

        receivedMap.set(
          item.orderDetailId,
          (receivedMap.get(item.orderDetailId) ?? 0) + receivedQuantity
        );
      });
    });

    return receivedMap;
  }, [generations]);

  const originalOrderQuantityByOrderDetailId = useMemo(() => {
    const originalQuantityMap = new Map<number, number>();

    order.items.forEach((item) => {
      const remainingQuantity = Math.max(0, item.quantity);
      const receivedQuantity = receivedQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;

      originalQuantityMap.set(item.orderDetailId, remainingQuantity + receivedQuantity);
    });

    return originalQuantityMap;
  }, [order.items, receivedQuantityByOrderDetailId]);

  const rows = useMemo(() => {
    return allItems.map((item) => {
      const draft = draftState[item.orderDetailId] ?? { selected: false, quantity: '' };
      const stockSnapshot = stockByItemId.get(item.orderDetailId) ?? {
        currentQuantity: 0,
      };
      const enteredQuantity = parsePositiveInteger(draft.quantity);
      const remainingQuantity = Math.max(0, item.quantity);
      const receivedQuantity = receivedQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;
      const originalOrderQuantity =
        originalOrderQuantityByOrderDetailId.get(item.orderDetailId) ?? remainingQuantity;
      const isCompleted = remainingQuantity === 0;
      let validationMessage: string | undefined;

      if (draft.selected && enteredQuantity > remainingQuantity) {
        validationMessage = `Fulfillment quantity cannot exceed remaining quantity (${remainingQuantity}).`;
      }

      return {
        item,
        isCompleted,
        selected: draft.selected,
        quantity: draft.quantity,
        enteredQuantity,
        originalOrderQuantity,
        remainingQuantity,
        receivedQuantity,
        currentQuantity: stockSnapshot.currentQuantity,
        validationMessage,
      };
    });
  }, [
    allItems,
    draftState,
    originalOrderQuantityByOrderDetailId,
    receivedQuantityByOrderDetailId,
    stockByItemId,
  ]);

  const selectedRows = rows.filter((row) => row.selected && row.enteredQuantity > 0);
  const selectedUnits = selectedRows.reduce((sum, row) => sum + row.enteredQuantity, 0);
  const hasValidationErrors = selectedRows.some((row) => row.validationMessage);

  const toggleEditMode = () => {
    if (isEditing) {
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(false);

      return;
    }

    setDraftState(createInitialDraftState(order.items));
    setIsEditing(true);
  };

  const updateDraftState = (
    orderDetailId: number,
    nextValue: Partial<{ selected: boolean; quantity: string }>
  ) => {
    setDraftState((current) => ({
      ...current,
      [orderDetailId]: {
        selected: current[orderDetailId]?.selected ?? false,
        quantity: current[orderDetailId]?.quantity ?? '',
        ...nextValue,
      },
    }));
  };

  const handleGenerate = async () => {
    if (selectedRows.length === 0) {
      toast.error('Select at least one pending item and enter a quantity.');

      return;
    }

    if (hasValidationErrors) {
      toast.error('Requested quantity exceeds the remaining quantity for one or more items.');

      return;
    }

    try {
      const result = await createGeneration({
        orderId: order.orderId,
        data: {
          items: selectedRows.map((row) => ({
            orderDetailId: row.item.orderDetailId,
            quantity: row.enteredQuantity,
          })),
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/purchase-orders/${order.orderId}`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/purchase-order-details'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/purchase-order-histories'] }),
        queryClient.invalidateQueries({
          queryKey: [`/api/purchase-orders/${order.orderId}/fulfillment-generations`],
        }),
      ]);

      toast.success(
        `Purchase order fulfillment saved successfully. ${getFulfillmentRecordLabel(order.orderId, {
          invoiceId: result.id,
          generationNumber: result.generationNumber,
        })}.`
      );
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4 border-t border-cyan-100 bg-cyan-50/30 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-cyan-100 text-cyan-900">{allItems.length} total items</Badge>
          <Badge className="bg-amber-100 text-amber-900">{pendingItems.length} pending items</Badge>
          <Badge className="bg-emerald-100 text-emerald-900">
            {completedItemsCount} completed items
          </Badge>
          <Badge className="bg-slate-100 text-slate-900">{totalPendingUnits} pending units</Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant={isEditing ? 'outline' : 'default'}
          className={cn(
            'gap-2',
            isEditing
              ? 'border-cyan-300 text-cyan-800 hover:bg-cyan-50'
              : 'bg-cyan-700 text-white hover:bg-cyan-800'
          )}
          onClick={toggleEditMode}
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? 'Cancel Edit' : 'Edit'}
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-cyan-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <PackageCheck className="h-5 w-5 text-cyan-700" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">Purchase Order Fulfillment</h4>
            <p className="text-sm text-slate-600">
              This page shows all purchase-order items. Completed items remain in the list, while
              only items with remaining quantity can be received again.
            </p>
          </div>
        </div>

        {allItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No purchase-order items are available for fulfillment.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-cyan-50/70">
                    {isEditing ? <TableHead className="w-14 text-center">Select</TableHead> : null}
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Order Qty</TableHead>
                    <TableHead className="text-center">Received Qty</TableHead>
                    <TableHead className="text-center">Remaining Qty</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="min-w-[180px]">Receive Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={row.item.orderDetailId}
                      className={cn(
                        row.isCompleted && 'opacity-80',
                        isEditing && row.selected && 'bg-cyan-50/60'
                      )}
                    >
                      {isEditing ? (
                        <TableCell className="text-center align-top">
                          <Checkbox
                            checked={row.selected}
                            disabled={row.isCompleted}
                            onCheckedChange={(checked) =>
                              updateDraftState(row.item.orderDetailId, {
                                selected: checked === true,
                                quantity: checked === true ? row.quantity : '',
                              })
                            }
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-100 text-xs font-bold text-cyan-900">
                              {index + 1}
                            </div>
                            <div className="font-semibold text-slate-900">
                              {row.item.productName || row.item.sku || `Item #${index + 1}`}
                            </div>
                            {row.item.sku ? (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                {row.item.sku}
                              </Badge>
                            ) : null}
                            <Badge
                              className={cn(
                                row.isCompleted
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              )}
                            >
                              {row.isCompleted ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                          {row.item.variantAttributes ? (
                            <p className="text-xs text-blue-700">{row.item.variantAttributes}</p>
                          ) : null}
                          <p className="text-xs text-slate-500">
                            Ordered qty: {row.originalOrderQuantity}
                          </p>
                          <p className="text-xs text-slate-500">
                            Received qty: {row.receivedQuantity}
                          </p>
                          <p className="text-xs text-slate-500">
                            Remaining qty: {row.remainingQuantity} • Remaining after save:{' '}
                            {isEditing && row.selected
                              ? Math.max(row.remainingQuantity - row.enteredQuantity, 0)
                              : row.remainingQuantity}
                          </p>
                          <p className="text-xs text-slate-500">
                            {typeof row.item.variantId === 'number'
                              ? 'Variant stock based item'
                              : 'Product stock based item'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        {row.originalOrderQuantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-emerald-700">
                        {row.receivedQuantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-amber-700">
                        {row.remainingQuantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        <div>{stocksLoading ? '...' : row.currentQuantity}</div>
                        <div className="text-[11px] text-slate-500">
                          {typeof row.item.variantId === 'number' ? 'Variant' : 'Product'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={row.quantity}
                              disabled={!row.selected || row.isCompleted}
                              onChange={(event) =>
                                updateDraftState(row.item.orderDetailId, {
                                  quantity: event.target.value,
                                })
                              }
                              className="border-slate-300"
                            />
                            {row.validationMessage ? (
                              <p className="text-xs font-medium text-rose-600">
                                {row.validationMessage}
                              </p>
                            ) : row.isCompleted ? (
                              <p className="text-xs font-medium text-emerald-700">
                                This item is completed.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">
                Selected to generate: {selectedUnits} units
              </div>
              <p className="text-xs text-slate-600">
                Every fulfillment generation remains recorded in the backend with per-item
                quantities.
              </p>
            </div>
            <Button
              type="button"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isGenerating || selectedRows.length === 0 || hasValidationErrors}
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Saving...' : 'Save Fulfillment'}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-slate-600" />
            <h4 className="font-semibold text-slate-900">Fulfillment History</h4>
            <Badge variant="secondary" className="bg-slate-100 text-slate-800">
              {generations.length} records
            </Badge>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Link href={`/purchase-orders/${order.orderId}/fulfillment/history`}>
              <History className="h-4 w-4" />
              View Full History
            </Link>
          </Button>
        </div>

        {generationsLoading ? (
          <p className="text-sm text-slate-500">Loading fulfillment history...</p>
        ) : generations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No fulfillment records have been recorded for this purchase order yet.
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map((generation) => (
              <div
                key={generation.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {getFulfillmentRecordLabel(order.orderId, {
                        invoiceId: generation.id,
                        generationNumber: generation.generationNumber,
                      })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatOrderDateTime(generation.createdDate)} •{' '}
                      {generation.createdBy || 'System'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-100 text-emerald-900">
                      {generation.totalGeneratedQuantity ?? 0} units received
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-900">
                      Outstanding after save: {generation.totalBacklogQuantity ?? 0}
                    </Badge>
                    {generation.id ? (
                      <Button
                        asChild
                        size="sm"
                        className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                      >
                        <Link
                          href={`/purchase-orders/${order.orderId}/fulfillment/history/${generation.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {generation.items?.length ? (
                  <div className="mt-3 space-y-2">
                    {generation.items.map((item) => (
                      <div
                        key={item.id ?? `${generation.id}-${item.orderDetailId}`}
                        className="flex flex-col gap-1 rounded-md border border-white bg-white px-3 py-2 text-sm lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="font-medium text-slate-800">
                          {item.productName || item.sku || `Order item #${item.orderDetailId}`}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                          <span>
                            Ordered:{' '}
                            {originalOrderQuantityByOrderDetailId.get(item.orderDetailId ?? -1) ??
                              0}
                          </span>
                          <span>Received: {item.deliveredQuantity ?? 0}</span>
                          <span>Pending Before: {item.availableQuantityBefore ?? 0}</span>
                          <span>Outstanding After: {item.remainingBacklogQuantity ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
