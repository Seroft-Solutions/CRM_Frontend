'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  History,
  Pencil,
  PackageCheck,
  RefreshCcw,
  ScanBarcode,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { BarcodeScanner } from '@/components/scanner/barcode-scanner';
import {
  normalizeScannedCode,
  useBarcodeScanner,
  type BarcodeScanResult,
  type BarcodeScanSource,
} from '@/components/scanner/use-barcode-scanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useGetAllProducts, type ProductDTO } from '@/core/api/generated/spring';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useRBAC } from '@/core/auth';
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import { normalizeProductCodeForBarcode } from '@/app/(protected)/(features)/products/components/barcode-utils';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';
import {
  useCreatePurchaseOrderFulfillmentGeneration,
  useGetPurchaseOrderFulfillmentGenerations,
} from '@/core/api/purchase-order-fulfillment-generations';
import type { OrderDetailItem, OrderRecord } from '../data/purchase-order-data';
import { useOrderFulfillmentStocks } from '../hooks/use-order-fulfillment-stocks';
import { formatOrderDateTime, getFulfillmentRecordLabel } from './order-fulfillment-utils';

type FulfillmentDraftState = Record<number, { selected: boolean; quantity: string }>;
type FulfillmentScanState = 'idle' | 'scanning' | 'complete' | 'overrun';
type FulfillmentScanMatchType = 'barcodeText' | 'sku' | 'partial';
type ScannableFulfillmentItem = OrderDetailItem & {
  resolvedBarcodeText?: string;
  resolvedSku?: string;
};

const PICK_AND_PACK_GROUPS = ['pick-and-pack', 'PICK_AND_PACK', 'PICK-AND-PACK', 'Pick & Pack'];

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

const normalizeFulfillmentCode = (value?: string | null) => {
  if (!value) return '';

  return normalizeProductCodeForBarcode(value) || normalizeScannedCode(value);
};

const getScanState = (scannedQty: number, requiredQty: number): FulfillmentScanState => {
  if (scannedQty <= 0) return 'idle';
  if (scannedQty > requiredQty) return 'overrun';
  if (scannedQty === requiredQty) return 'complete';

  return 'scanning';
};

const scanStateClasses: Record<FulfillmentScanState, string> = {
  idle: 'border-l-[#93C5FD] bg-[#EFF6FF] hover:bg-[#EFF6FF]',
  scanning: 'border-l-[#3B82F6] bg-[#DBEAFE] hover:bg-[#DBEAFE]',
  complete: 'border-l-[#16A34A] bg-[#DBEAFE] ring-1 ring-inset ring-[#86EFAC] hover:bg-[#DBEAFE]',
  overrun: 'border-l-[#DC2626] bg-[#DBEAFE] ring-1 ring-inset ring-[#FECACA] hover:bg-[#DBEAFE]',
};

const getProgressClassName = (scanState: FulfillmentScanState) => {
  if (scanState === 'complete') return 'bg-emerald-500';
  if (scanState === 'overrun') return 'bg-rose-500';

  return 'bg-amber-400';
};

const findMatchingFulfillmentItem = (
  code: string,
  items: ScannableFulfillmentItem[]
): { item: ScannableFulfillmentItem; matchType: FulfillmentScanMatchType } | null => {
  const normalizedCode = normalizeFulfillmentCode(code);

  if (!normalizedCode) return null;

  const exactBarcodeMatch = items.find(
    (item) => normalizeFulfillmentCode(item.resolvedBarcodeText) === normalizedCode
  );

  if (exactBarcodeMatch) {
    return { item: exactBarcodeMatch, matchType: 'barcodeText' };
  }

  const exactSkuMatch = items.find(
    (item) => normalizeFulfillmentCode(item.resolvedSku) === normalizedCode
  );

  if (exactSkuMatch) {
    return { item: exactSkuMatch, matchType: 'sku' };
  }

  const partialMatch = items.find((item) => {
    const candidates = [
      normalizeFulfillmentCode(item.resolvedBarcodeText),
      normalizeFulfillmentCode(item.resolvedSku),
    ].filter(Boolean);

    return candidates.some(
      (candidate) => candidate.includes(normalizedCode) || normalizedCode.includes(candidate)
    );
  });

  return partialMatch ? { item: partialMatch, matchType: 'partial' } : null;
};

const createInitialDraftState = (items: OrderDetailItem[]): FulfillmentDraftState =>
  Object.fromEntries(
    items
      .filter(
        (item) =>
          Math.max(0, item.quantity) > 0 &&
          (item.itemStatusCode === 'APPROVED' || item.itemStatusCode === 'PENDING')
      )
      .map((item) => [item.orderDetailId, { selected: false, quantity: '' }])
  );

export function OrderFulfillmentPanel({ order }: { order: OrderRecord }) {
  const queryClient = useQueryClient();
  const rbac = useRBAC();
  const [isEditing, setIsEditing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [draftState, setDraftState] = useState<FulfillmentDraftState>(() =>
    createInitialDraftState(order.items)
  );
  const allItems = useMemo(() => order.items, [order.items]);
  const pendingItems = useMemo(
    () =>
      order.items.filter(
        (item) =>
          Math.max(0, item.quantity) > 0 &&
          (item.itemStatusCode === 'APPROVED' || item.itemStatusCode === 'PENDING')
      ),
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
  const productIds = useMemo(
    () =>
      Array.from(
        new Set(
          order.items
            .map((item) => item.productId)
            .filter((id): id is number => typeof id === 'number')
        )
      ),
    [order.items]
  );
  const { data: productRows = [] } = useGetAllProducts(
    productIds.length > 0
      ? {
          page: 0,
          size: Math.max(productIds.length, 1),
          sort: ['name,asc'],
          'id.in': productIds,
        }
      : undefined,
    {
      query: {
        enabled: productIds.length > 0,
        staleTime: 5 * 60 * 1000,
      },
    }
  );
  const { data: generations = [], isLoading: generationsLoading } =
    useGetPurchaseOrderFulfillmentGenerations(order.orderId);
  const { mutateAsync: createGeneration, isPending: isGenerating } =
    useCreatePurchaseOrderFulfillmentGeneration();

  useEffect(() => {
    setDraftState(createInitialDraftState(order.items));
    setIsEditing(false);
    setScannerOpen(false);
  }, [order.items]);

  const canUseScanner = PICK_AND_PACK_GROUPS.some((group) => rbac.hasGroup(group));

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

  const productById = useMemo(
    () =>
      new Map(
        (productRows as ProductDTO[])
          .filter(
            (product): product is ProductDTO & { id: number } => typeof product.id === 'number'
          )
          .map((product) => [product.id, product])
      ),
    [productRows]
  );

  const scannableItems = useMemo<ScannableFulfillmentItem[]>(
    () =>
      pendingItems.map((item) => {
        const product =
          typeof item.productId === 'number' ? productById.get(item.productId) : undefined;

        return {
          ...item,
          resolvedBarcodeText:
            item.barcodeText ??
            item.articleNumber ??
            product?.barcodeText ??
            product?.articleNumber,
          resolvedSku:
            item.sku ?? product?.articleNumber ?? product?.articalNumber ?? product?.barcodeText,
        };
      }),
    [pendingItems, productById]
  );

  const rows = useMemo(() => {
    return allItems.map((item) => {
      const product =
        typeof item.productId === 'number' ? productById.get(item.productId) : undefined;
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
      const isFulfillable = item.itemStatusCode === 'APPROVED' || item.itemStatusCode === 'PENDING';
      let validationMessage: string | undefined;

      if (draft.selected && !isFulfillable) {
        validationMessage = 'Only Approved or Pending items can be fulfilled.';
      } else if (draft.selected && enteredQuantity > remainingQuantity) {
        validationMessage = `Fulfillment quantity cannot exceed remaining quantity (${remainingQuantity}).`;
      }

      return {
        item,
        isCompleted,
        isFulfillable,
        selected: draft.selected,
        quantity: draft.quantity,
        enteredQuantity,
        originalOrderQuantity,
        remainingQuantity,
        receivedQuantity,
        currentQuantity: stockSnapshot.currentQuantity,
        resolvedBarcodeText:
          item.barcodeText ?? item.articleNumber ?? product?.barcodeText ?? product?.articleNumber,
        resolvedSku:
          item.sku ?? product?.articleNumber ?? product?.articalNumber ?? product?.barcodeText,
        validationMessage,
        scanState: getScanState(enteredQuantity, remainingQuantity),
        scanProgress:
          remainingQuantity > 0
            ? Math.min(100, Math.round((enteredQuantity / remainingQuantity) * 100))
            : 100,
      };
    });
  }, [
    allItems,
    draftState,
    originalOrderQuantityByOrderDetailId,
    productById,
    receivedQuantityByOrderDetailId,
    stockByItemId,
  ]);

  const selectedRows = rows.filter((row) => row.selected && row.enteredQuantity > 0);
  const selectedUnits = selectedRows.reduce((sum, row) => sum + row.enteredQuantity, 0);
  const hasValidationErrors = selectedRows.some((row) => row.validationMessage);
  const totalScannedUnits = rows.reduce((sum, row) => sum + row.enteredQuantity, 0);
  const remainingScanUnits = Math.max(0, totalPendingUnits - totalScannedUnits);
  const overrunRows = rows.filter((row) => row.scanState === 'overrun');
  const scannerCompletionSatisfied =
    pendingItems.length > 0 &&
    rows
      .filter((row) => !row.isCompleted && row.isFulfillable && row.remainingQuantity > 0)
      .every((row) => row.enteredQuantity >= row.remainingQuantity);

  const toggleEditMode = () => {
    if (isEditing) {
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(false);
      setScannerOpen(false);

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

  const handleScannerToggle = () => {
    if (scannerOpen) {
      setScannerOpen(false);

      return;
    }

    if (!isEditing) {
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(true);
    }

    setScannerOpen(true);
  };

  const handleScan = useCallback(
    (code: string, source: BarcodeScanSource): BarcodeScanResult => {
      const match = findMatchingFulfillmentItem(code, scannableItems);

      if (!match) {
        return {
          accepted: false,
          message: 'Not found',
          variant: 'warning',
        };
      }

      const requiredQty = Math.max(0, match.item.quantity);
      let nextScannedQty = 1;

      setDraftState((current) => {
        const currentDraft = current[match.item.orderDetailId] ?? { selected: false, quantity: '' };
        const currentQty = parsePositiveInteger(currentDraft.quantity);

        nextScannedQty = currentQty + 1;

        return {
          ...current,
          [match.item.orderDetailId]: {
            selected: true,
            quantity: String(nextScannedQty),
          },
        };
      });

      const scanState = getScanState(nextScannedQty, requiredQty);
      const label =
        match.item.productName || match.item.resolvedSku || `Item ${match.item.orderDetailId}`;
      const sourceLabel = source === 'manual' ? 'manual' : 'camera';

      if (scanState === 'overrun') {
        return {
          accepted: true,
          message: `OVER QUANTITY ${nextScannedQty}/${requiredQty}`,
          variant: 'error',
        };
      }

      if (scanState === 'complete') {
        return {
          accepted: true,
          message: `COMPLETE ${label}`,
          variant: 'success',
        };
      }

      return {
        accepted: true,
        message: `${nextScannedQty}/${requiredQty} scanned (${match.matchType}, ${sourceLabel})`,
        variant: 'success',
      };
    },
    [scannableItems]
  );

  const scanner = useBarcodeScanner({ onScan: handleScan });

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
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/purchase-orders/${order.orderId}`] }),
        queryClient.refetchQueries({ queryKey: ['/api/purchase-order-details'] }),
      ]);

      toast.success(
        `Purchase order fulfillment saved successfully. ${getFulfillmentRecordLabel(order.orderId, {
          invoiceId: result.id,
          generationNumber: result.generationNumber,
        })}.`
      );
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(false);
      setScannerOpen(false);
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
        <div className="flex flex-wrap items-center gap-2">
          {canUseScanner ? (
            <Button
              type="button"
              size="sm"
              variant={scannerOpen ? 'outline' : 'default'}
              className={cn(
                'gap-2',
                scannerOpen
                  ? 'border-slate-400 text-slate-800 hover:bg-slate-50'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
              onClick={handleScannerToggle}
            >
              <ScanBarcode className="h-4 w-4" />
              {scannerOpen ? 'Close Scanner' : 'Start Scanner'}
            </Button>
          ) : null}
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
              only approved or pending items with remaining quantity can be received again.
            </p>
          </div>
        </div>

        {scannerOpen && canUseScanner ? (
          <div className="grid gap-3 rounded-lg border border-slate-300 bg-slate-50 p-3 md:grid-cols-4">
            <div className="rounded-md bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">Scanned</div>
              <div className="text-2xl font-bold text-slate-950">{totalScannedUnits}</div>
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">Required</div>
              <div className="text-2xl font-bold text-slate-950">{totalPendingUnits}</div>
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">Remaining</div>
              <div className="text-2xl font-bold text-amber-700">{remainingScanUnits}</div>
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">Status</div>
              <div
                className={cn(
                  'flex items-center gap-2 text-sm font-bold',
                  overrunRows.length > 0
                    ? 'text-rose-700'
                    : scannerCompletionSatisfied
                      ? 'text-emerald-700'
                      : 'text-slate-700'
                )}
              >
                {overrunRows.length > 0 ? (
                  <XCircle className="h-4 w-4" />
                ) : scannerCompletionSatisfied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {overrunRows.length > 0
                  ? `${overrunRows.length} over quantity`
                  : scannerCompletionSatisfied
                    ? 'Ready to complete'
                    : 'Scanning'}
              </div>
            </div>
          </div>
        ) : null}

        {scannerOpen && canUseScanner ? (
          <BarcodeScanner
            feedback={scanner.feedback}
            flashKey={scanner.flashKey}
            onScan={(code, source) => {
              scanner.submitScan(code, source);
            }}
            open={scannerOpen}
            scanLocked={scanner.scanLocked}
          />
        ) : null}

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
                    <TableHead className="text-center">Warehouse</TableHead>
                    <TableHead className="text-center">Order Qty</TableHead>
                    <TableHead className="text-center">Received Qty</TableHead>
                    <TableHead className="text-center">Remaining Qty</TableHead>
                    <TableHead className="text-center">Available Stock</TableHead>
                    <TableHead className="min-w-[180px]">Receive Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={row.item.orderDetailId}
                      className={cn(
                        scannerOpen && 'border-l-4',
                        scannerOpen && scanStateClasses[row.scanState],
                        row.isCompleted && 'opacity-80',
                        isEditing && row.selected && !scannerOpen && 'bg-cyan-50/60'
                      )}
                    >
                      {isEditing ? (
                        <TableCell className="text-center align-top">
                          <Checkbox
                            checked={row.selected}
                            disabled={row.isCompleted || !row.isFulfillable}
                            onCheckedChange={(checked) =>
                              updateDraftState(row.item.orderDetailId, {
                                selected: checked === true,
                                quantity: checked === true ? String(row.remainingQuantity) : '',
                              })
                            }
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="align-top">
                        <div>
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
                            {scannerOpen && row.resolvedBarcodeText ? (
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-white/70 text-blue-800"
                              >
                                {row.resolvedBarcodeText}
                              </Badge>
                            ) : null}
                            <Badge
                              className={cn(
                                row.isCompleted
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : row.isFulfillable
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-slate-100 text-slate-800'
                              )}
                            >
                              {row.item.itemStatus}
                            </Badge>
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
                        {row.receivedQuantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-amber-700">
                        {row.remainingQuantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        {stocksLoading ? '...' : row.currentQuantity}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            {scannerOpen && row.isFulfillable && !row.isCompleted ? (
                              <div className="space-y-1">
                                <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      getProgressClassName(row.scanState)
                                    )}
                                    style={{ width: `${row.scanProgress}%` }}
                                  />
                                </div>
                                <div
                                  className={cn(
                                    'text-xs font-bold',
                                    row.scanState === 'complete' && 'text-emerald-700',
                                    row.scanState === 'overrun' && 'text-rose-700',
                                    row.scanState === 'idle' && 'text-blue-700',
                                    row.scanState === 'scanning' && 'text-blue-800'
                                  )}
                                >
                                  {row.enteredQuantity}/{row.remainingQuantity} scanned
                                </div>
                              </div>
                            ) : null}
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={row.quantity}
                              disabled={!row.selected || row.isCompleted || !row.isFulfillable}
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
                            ) : !row.isFulfillable ? (
                              <p className="text-xs font-medium text-slate-500">
                                Approve this item before fulfillment.
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
              disabled={
                isGenerating ||
                selectedRows.length === 0 ||
                hasValidationErrors ||
                (scannerOpen && !scannerCompletionSatisfied)
              }
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating
                ? 'Saving...'
                : scannerOpen
                  ? 'Complete Fulfillment'
                  : 'Save Fulfillment'}
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
                      Remaining after save: {generation.totalBacklogQuantity ?? 0}
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
