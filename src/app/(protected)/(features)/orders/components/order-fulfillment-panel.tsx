'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';
import {
  useCreateOrderFulfillmentGeneration,
  useGetOrderFulfillmentGenerations,
} from '@/core/api/order-fulfillment-generations';
import type { OrderDetailItem, OrderRecord } from '../data/order-data';
import { useUpdateOrderDetailStatus } from '../api/order-detail-status';
import { useOrderFulfillmentStocks } from '../hooks/use-order-fulfillment-stocks';
import { formatOrderDateTime, getFulfillmentRecordLabel } from './order-fulfillment-utils';

type FulfillmentDraftState = Record<
  number,
  { selected: boolean; quantity: string; picked: boolean; packed: boolean }
>;

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
      'Unable to save order fulfillment.'
    );
  }

  return 'Unable to save order fulfillment.';
};

const createInitialDraftState = (items: OrderDetailItem[]): FulfillmentDraftState =>
  Object.fromEntries(
    items
      .filter((item) => Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity) > 0)
      .map((item) => [
        item.orderDetailId,
        {
          selected: false,
          quantity: '',
          picked: item.itemStatusCode === 'PICKED' || item.itemStatusCode === 'PACKED',
          packed: item.itemStatusCode === 'PACKED',
        },
      ])
  );

const canTransitionToPickPack = (item: OrderDetailItem) =>
  item.itemStatusCode === 'APPROVED' || item.itemStatusCode === 'PENDING';

const isTerminalItem = (item: OrderDetailItem) =>
  item.itemStatusCode === 'COMPLETED' || item.itemStatusCode === 'CANCELLED';

export function OrderFulfillmentPanel({ order }: { order: OrderRecord }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const navigationSource = searchParams.get('from') === 'list' ? 'list' : 'order';
  const [isEditing, setIsEditing] = useState(navigationSource === 'order');
  const [draftState, setDraftState] = useState<FulfillmentDraftState>(() =>
    createInitialDraftState(order.items)
  );
  const allItems = useMemo(() => order.items, [order.items]);
  const pendingItems = useMemo(
    () =>
      order.items.filter(
        (item) => Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity) > 0
      ),
    [order.items]
  );
  const completedItemsCount = useMemo(
    () =>
      allItems.filter(
        (item) => Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity) === 0
      ).length,
    [allItems]
  );
  const totalPendingUnits = useMemo(
    () =>
      pendingItems.reduce(
        (sum, item) => sum + Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity),
        0
      ),
    [pendingItems]
  );
  const warehouseQueryParams = useMemo(
    () => ({
      page: 0,
      size: 1000,
      sort: ['name,asc'],
      'status.equals': 'ACTIVE' as const,
    }),
    []
  );

  const { stockByItemId, isLoading: stocksLoading } = useOrderFulfillmentStocks(order.items);
  const { data: warehouseRows = [] } = useWarehousesQuery(warehouseQueryParams, { enabled: true });
  const { data: generations = [], isLoading: generationsLoading } =
    useGetOrderFulfillmentGenerations(order.orderId);
  const { mutateAsync: createGeneration, isPending: isGenerating } =
    useCreateOrderFulfillmentGeneration();
  const { mutateAsync: updateOrderDetailStatus, isPending: isUpdatingStatus } =
    useUpdateOrderDetailStatus();
  const canFulfillOrder = order.orderStatus === 'Approved' || order.orderStatus === 'Pending';

  useEffect(() => {
    setDraftState(createInitialDraftState(order.items));
    setIsEditing(navigationSource === 'order');
  }, [navigationSource, order.items]);

  const deliveredQuantityByOrderDetailId = useMemo(() => {
    const deliveredMap = new Map<number, number>();

    generations.forEach((generation) => {
      generation.items?.forEach((item) => {
        if (typeof item.orderDetailId !== 'number') {
          return;
        }

        const deliveredQuantity = Math.max(0, item.deliveredQuantity ?? 0);

        deliveredMap.set(
          item.orderDetailId,
          (deliveredMap.get(item.orderDetailId) ?? 0) + deliveredQuantity
        );
      });
    });

    return deliveredMap;
  }, [generations]);
  const warehouseNameById = useMemo(
    () =>
      new Map(
        (warehouseRows as IWarehouse[])
          .filter(
            (warehouse): warehouse is IWarehouse & { id: number } =>
              typeof warehouse.id === 'number'
          )
          .map((warehouse) => [warehouse.id, warehouse.name])
      ),
    [warehouseRows]
  );

  const originalOrderQuantityByOrderDetailId = useMemo(() => {
    const originalQuantityMap = new Map<number, number>();

    order.items.forEach((item) => {
      const remainingQuantity = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const deliveredQuantity = deliveredQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;

      originalQuantityMap.set(item.orderDetailId, remainingQuantity + deliveredQuantity);
    });

    return originalQuantityMap;
  }, [deliveredQuantityByOrderDetailId, order.items]);

  const rows = useMemo(() => {
    return allItems.map((item) => {
      const draft = draftState[item.orderDetailId] ?? {
        selected: false,
        quantity: '',
        picked: false,
        packed: false,
      };
      const stockSnapshot = stockByItemId.get(item.orderDetailId) ?? {
        availableQuantity: 0,
        deliverableQuantity: 0,
      };
      const enteredQuantity = parsePositiveInteger(draft.quantity);
      const remainingQuantity = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const deliveredQuantity = deliveredQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;
      const originalOrderQuantity =
        originalOrderQuantityByOrderDetailId.get(item.orderDetailId) ?? remainingQuantity;
      const isCompleted = remainingQuantity === 0;
      const statusPicked = item.itemStatusCode === 'PICKED' || item.itemStatusCode === 'PACKED';
      const statusPacked = item.itemStatusCode === 'PACKED';
      let validationMessage: string | undefined;

      if (draft.selected && enteredQuantity > stockSnapshot.availableQuantity) {
        validationMessage = 'Stock not available';
      } else if (draft.selected && enteredQuantity > remainingQuantity) {
        validationMessage = `Fulfillment quantity cannot exceed remaining quantity (${remainingQuantity}).`;
      }

      return {
        item,
        isCompleted,
        selected: draft.selected,
        quantity: draft.quantity,
        picked: statusPicked || draft.picked,
        packed: statusPacked || draft.packed,
        canChangePickPack: canTransitionToPickPack(item),
        isTerminalStatus: isTerminalItem(item),
        enteredQuantity,
        originalOrderQuantity,
        remainingQuantity,
        deliveredQuantity,
        availableQuantity: stockSnapshot.availableQuantity,
        deliverableQuantity: stockSnapshot.deliverableQuantity,
        validationMessage,
      };
    });
  }, [
    allItems,
    deliveredQuantityByOrderDetailId,
    draftState,
    originalOrderQuantityByOrderDetailId,
    stockByItemId,
  ]);

  const selectedRows = rows.filter((row) => row.selected && row.enteredQuantity > 0);
  const selectedUnits = selectedRows.reduce((sum, row) => sum + row.enteredQuantity, 0);
  const hasValidationErrors = selectedRows.some((row) => row.validationMessage);
  const hasSelectedRowsMissingPickPack = selectedRows.some((row) => !row.picked || !row.packed);
  const canSaveFulfillment = selectedRows.length > 0 && !hasSelectedRowsMissingPickPack;

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
    nextValue: Partial<{ selected: boolean; quantity: string; picked: boolean; packed: boolean }>
  ) => {
    setDraftState((current) => ({
      ...current,
      [orderDetailId]: {
        selected: current[orderDetailId]?.selected ?? false,
        quantity: current[orderDetailId]?.quantity ?? '',
        picked: current[orderDetailId]?.picked ?? false,
        packed: current[orderDetailId]?.packed ?? false,
        ...nextValue,
      },
    }));
  };

  const handleGenerate = async () => {
    if (!canFulfillOrder) {
      toast.error('Only approved or pending orders can be fulfilled.');

      return;
    }

    if (selectedRows.length === 0) {
      toast.error('Select at least one pending item and enter a quantity.');

      return;
    }

    if (hasValidationErrors) {
      toast.error('Requested quantity exceeds the deliverable inventory for one or more items.');

      return;
    }

    if (!canSaveFulfillment) {
      toast.error('Mark the order as picked and packed before saving fulfillment.');

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
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.orderId}`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/order-details'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/order-histories'] }),
        queryClient.invalidateQueries({
          queryKey: [`/api/orders/${order.orderId}/fulfillment-generations`],
        }),
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];

            return (
              typeof key === 'string' &&
              (key.startsWith('/api/products/') || key.startsWith('/api/product-variants/'))
            );
          },
        }),
      ]);

      toast.success(
        `Order fulfillment saved successfully. ${getFulfillmentRecordLabel(order.orderId, {
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

  const handlePickedChange = async (row: (typeof rows)[number], checked: boolean) => {
    if (!checked) {
      toast.error('Picked status cannot be reverted from this screen.');

      return;
    }

    if (!row.canChangePickPack) {
      toast.error('Only approved or pending items can be marked picked.');

      return;
    }

    try {
      updateDraftState(row.item.orderDetailId, { picked: true });
      await updateOrderDetailStatus({
        orderDetailId: row.item.orderDetailId,
        newStatus: 'PICKED',
        orderId: order.orderId,
      });
      toast.success('Item marked picked.');
    } catch (error) {
      updateDraftState(row.item.orderDetailId, { picked: false });
      toast.error(getErrorMessage(error));
    }
  };

  const handlePackedChange = async (row: (typeof rows)[number], checked: boolean) => {
    if (!checked) {
      toast.error('Packed status cannot be reverted from this screen.');

      return;
    }

    if (!row.canChangePickPack && row.item.itemStatusCode !== 'PICKED') {
      toast.error('Only approved, pending or picked items can be marked packed.');

      return;
    }

    try {
      updateDraftState(row.item.orderDetailId, { picked: true, packed: true });
      await updateOrderDetailStatus({
        orderDetailId: row.item.orderDetailId,
        newStatus: 'PACKED',
        orderId: order.orderId,
      });
      toast.success('Item marked packed.');
    } catch (error) {
      updateDraftState(row.item.orderDetailId, { packed: false });
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4 border-t border-cyan-100 bg-cyan-50/30 p-4">
      {!canFulfillOrder ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This order must be approved or pending before Picker/Packer fulfillment can be saved.
        </div>
      ) : null}
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
            !canFulfillOrder ? 'cursor-not-allowed border-slate-200 text-slate-400' : undefined,
            isEditing
              ? 'border-cyan-300 text-cyan-800 hover:bg-cyan-50'
              : 'bg-cyan-700 text-white hover:bg-cyan-800'
          )}
          disabled={!canFulfillOrder}
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
            <h4 className="font-semibold text-slate-900">Order Fulfillment</h4>
            <p className="text-sm text-slate-600">
              This page shows all order items. Completed items remain in the list, while only items
              with remaining quantity can be fulfilled again.
            </p>
          </div>
        </div>

        {allItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No order items are available for fulfillment.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-cyan-50/70">
                    {isEditing ? <TableHead className="w-14 text-center">Select</TableHead> : null}
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Warehouse</TableHead>
                    <TableHead className="text-center">Order Qty</TableHead>
                    <TableHead className="text-center">Delivered Qty</TableHead>
                    <TableHead className="text-center">Remaining Qty</TableHead>
                    <TableHead className="text-center">Available Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Picked</TableHead>
                    <TableHead className="text-center">Packed</TableHead>
                    <TableHead className="min-w-[180px]">Fulfill Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => {
                    const backlogResolved = row.isCompleted;
                    const availableStockLabel =
                      typeof row.item.variantId === 'number'
                        ? 'Warehouse main stock'
                        : 'Product main stock';

                    return (
                      <TableRow
                        key={row.item.orderDetailId}
                        className={cn(
                          backlogResolved && 'opacity-80',
                          isEditing && row.selected && 'bg-cyan-50/60'
                        )}
                      >
                        {isEditing ? (
                          <TableCell className="text-center align-top">
                            <Checkbox
                              checked={row.selected}
                              disabled={row.isCompleted || row.deliverableQuantity === 0}
                              onCheckedChange={(checked) =>
                                updateDraftState(row.item.orderDetailId, {
                                  selected: checked === true,
                                  quantity: checked === true ? row.quantity : '',
                                  picked: checked === true ? row.picked : false,
                                  packed: checked === true ? row.packed : false,
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
                            </div>
                            {row.item.variantAttributes ? (
                              <p className="text-xs text-blue-700">{row.item.variantAttributes}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {typeof row.item.warehouseId === 'number'
                            ? (warehouseNameById.get(row.item.warehouseId) ??
                              `Warehouse ${row.item.warehouseId}`)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {row.originalOrderQuantity}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-emerald-700">
                          {row.deliveredQuantity}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-amber-700">
                          {row.remainingQuantity}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          <div>{stocksLoading ? '...' : row.availableQuantity}</div>
                          <div className="text-[11px] text-slate-500">{availableStockLabel}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                            {row.item.itemStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={row.picked}
                            disabled={
                              !isEditing ||
                              !row.selected ||
                              row.isTerminalStatus ||
                              !row.canChangePickPack ||
                              isUpdatingStatus
                            }
                            onCheckedChange={(checked) => handlePickedChange(row, checked === true)}
                            className="mx-auto data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={row.packed}
                            disabled={
                              !isEditing ||
                              !row.selected ||
                              row.isTerminalStatus ||
                              (!row.canChangePickPack && row.item.itemStatusCode !== 'PICKED') ||
                              isUpdatingStatus
                            }
                            onCheckedChange={(checked) => handlePackedChange(row, checked === true)}
                            className="mx-auto data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={row.quantity}
                                disabled={
                                  !row.selected || row.isCompleted || row.deliverableQuantity === 0
                                }
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
                              ) : row.deliverableQuantity === 0 ? (
                                <p className="text-xs font-medium text-amber-700">
                                  No inventory is currently available for this item.
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-500">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              {selectedRows.length > 0 && !canSaveFulfillment ? (
                <p className="text-xs font-medium text-amber-700">
                  Each selected row must have both Picked and Packed checked before fulfillment can
                  be saved.
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={
                isGenerating || hasValidationErrors || !canFulfillOrder || !canSaveFulfillment
              }
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
            <Link href={`/orders/${order.orderId}/fulfillment/history?from=${navigationSource}`}>
              <History className="h-4 w-4" />
              View Full History
            </Link>
          </Button>
        </div>

        {generationsLoading ? (
          <p className="text-sm text-slate-500">Loading fulfillment history...</p>
        ) : generations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No fulfillment records have been recorded for this order yet.
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
                      {generation.totalGeneratedQuantity ?? 0} units generated
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-900">
                      Remaining after save: {generation.totalBacklogQuantity ?? 0}
                    </Badge>
                    {generation.id ? (
                      <Button
                        asChild
                        size="sm"
                        className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                      >
                        <Link
                          href={`/orders/${order.orderId}/fulfillment/history/${generation.id}`}
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
                          <span>Delivered: {item.deliveredQuantity ?? 0}</span>
                          <span>Available Before: {item.availableQuantityBefore ?? 0}</span>
                          <span>Remaining After: {item.remainingBacklogQuantity ?? 0}</span>
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
