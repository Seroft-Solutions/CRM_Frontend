'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Camera,
  CameraOff,
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
type LastReceivingScan = {
  code: string;
  label: string;
  status: 'matched' | 'not-found';
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
      'Unable to save purchase order receiving.'
    );
  }

  return 'Unable to save purchase order receiving.';
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
  const [lastReceivingScan, setLastReceivingScan] = useState<LastReceivingScan | null>(null);
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
    setLastReceivingScan(null);
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
        validationMessage = `Receive quantity cannot exceed remaining quantity (${remainingQuantity}).`;
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
      setLastReceivingScan(null);

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
        setLastReceivingScan({
          code,
          label: 'No purchase order line matched',
          status: 'not-found',
        });

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

      setLastReceivingScan({
        code,
        label,
        status: 'matched',
      });

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
      toast.error('Select at least one pending item and enter a receive quantity.');

      return;
    }

    if (hasValidationErrors) {
      toast.error('Receive quantity exceeds the remaining quantity for one or more items.');

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
        `Purchase order receiving saved successfully. ${getFulfillmentRecordLabel(order.orderId, {
          invoiceId: result.id,
          generationNumber: result.generationNumber,
        })}.`
      );
      setDraftState(createInitialDraftState(order.items));
      setIsEditing(false);
      setScannerOpen(false);
      setLastReceivingScan(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="min-w-0 space-y-3 overflow-x-clip bg-slate-50 p-2 sm:p-3">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: 'Total Items', value: allItems.length, className: 'border-slate-200' },
          { label: 'Pending Items', value: pendingItems.length, className: 'border-amber-200' },
          {
            label: 'Completed Items',
            value: completedItemsCount,
            className: 'border-emerald-200',
          },
          { label: 'Pending Units', value: totalPendingUnits, className: 'border-blue-200' },
        ].map((metric) => (
          <div
            key={metric.label}
            className={cn(
              'min-w-0 rounded-lg border bg-white px-2.5 py-2 shadow-sm sm:px-3',
              metric.className
            )}
          >
            <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {metric.label}
            </div>
            <div className="text-lg font-black tabular-nums text-slate-950 sm:text-xl">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="order-2 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:order-1">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-emerald-300">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-950">Receiving Lines</h2>
                <p className="truncate text-xs text-slate-500">
                  Match received units to PO quantities and warehouse stock.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge className="bg-slate-100 text-[11px] text-slate-800">
                {selectedUnits} Selected Units
              </Badge>
              {hasValidationErrors ? (
                <Badge className="bg-rose-100 text-[11px] text-rose-800">
                  Quantity Check Required
                </Badge>
              ) : null}
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="m-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No purchase-order items are available for receiving.
            </div>
          ) : (
            <div className="max-w-full overflow-auto overscroll-contain max-sm:max-h-[70dvh] sm:max-h-[calc(100dvh-15rem)]">
              <Table className="min-w-[820px] text-xs sm:min-w-[980px]">
                <TableHeader className="sticky top-0 z-20 shadow-sm">
                  <TableRow className="border-b border-slate-200 bg-slate-100">
                    {isEditing ? (
                      <TableHead className="w-10 bg-slate-100 text-center text-[10px] uppercase">
                        Select
                      </TableHead>
                    ) : null}
                    <TableHead className="sticky left-0 z-30 min-w-[220px] bg-slate-100 text-[10px] uppercase sm:min-w-[280px]">
                      Product / SKU
                    </TableHead>
                    <TableHead className="min-w-[130px] text-center text-[10px] uppercase">
                      Warehouse
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Ordered</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Received</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Remaining</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Stock</TableHead>
                    <TableHead className="min-w-[170px] text-right text-[10px] uppercase">
                      Receive
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={row.item.orderDetailId}
                      className={cn(
                        'h-12 border-b border-slate-100',
                        scannerOpen && 'border-l-4',
                        scannerOpen && scanStateClasses[row.scanState],
                        row.isCompleted && 'bg-slate-50 text-slate-500',
                        isEditing && row.selected && !scannerOpen && 'bg-emerald-50/70'
                      )}
                    >
                      {isEditing ? (
                        <TableCell className="text-center align-middle">
                          <Checkbox
                            aria-label={`Select ${row.item.productName || row.item.sku || `item ${index + 1}`} for receiving`}
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
                      <TableCell
                        className={cn(
                          'sticky left-0 z-10 bg-white align-middle shadow-[1px_0_0_0_rgba(226,232,240,1)]',
                          row.isCompleted && 'bg-slate-50',
                          isEditing && row.selected && !scannerOpen && 'bg-emerald-50'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white sm:h-6 sm:w-6">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-950">
                              {row.item.productName || row.item.sku || `Item #${index + 1}`}
                            </div>
                            <div className="mt-1 flex min-w-0 flex-wrap gap-1">
                              {row.item.sku ? (
                                <Badge
                                  variant="secondary"
                                  className="h-5 max-w-[110px] truncate bg-slate-100 px-1.5 text-[10px] text-slate-700 sm:max-w-[130px]"
                                >
                                  {row.item.sku}
                                </Badge>
                              ) : null}
                              {scannerOpen && row.resolvedBarcodeText ? (
                                <Badge
                                  variant="outline"
                                  className="h-5 max-w-[130px] truncate border-blue-200 bg-blue-50 px-1.5 text-[10px] text-blue-800"
                                >
                                  {row.resolvedBarcodeText}
                                </Badge>
                              ) : null}
                              <Badge
                                className={cn(
                                  'h-5 px-1.5 text-[10px]',
                                  row.isCompleted
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : row.isFulfillable
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-100 text-slate-800'
                                )}
                              >
                                {row.item.itemStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-800">
                        <span className="line-clamp-2">
                          {typeof row.item.warehouseId === 'number'
                            ? (warehouseNameById.get(row.item.warehouseId) ??
                              `Warehouse ${row.item.warehouseId}`)
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-slate-900">
                        {row.originalOrderQuantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-emerald-700">
                        {row.receivedQuantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-amber-700">
                        {row.remainingQuantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-slate-900">
                        {stocksLoading ? '…' : row.currentQuantity}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="ml-auto max-w-[150px] space-y-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                getProgressClassName(row.scanState)
                              )}
                              style={{ width: `${row.scanProgress}%` }}
                            />
                          </div>
                          {isEditing ? (
                            <Input
                              aria-label={`Receive quantity for ${row.item.productName || row.item.sku || `item ${index + 1}`}`}
                              name={`receiveQuantity-${row.item.orderDetailId}`}
                              autoComplete="off"
                              inputMode="numeric"
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
                              className="h-10 border-slate-300 text-right text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-8 sm:text-xs"
                            />
                          ) : (
                            <div className="text-right text-xs font-semibold text-slate-400">—</div>
                          )}
                          <div className="text-right text-[10px] font-semibold tabular-nums text-slate-500">
                            {row.enteredQuantity}/{row.remainingQuantity} Ready
                          </div>
                          {row.validationMessage ? (
                            <p className="text-right text-[10px] font-medium text-rose-600">
                              {row.validationMessage}
                            </p>
                          ) : row.isCompleted ? (
                            <p className="text-right text-[10px] font-medium text-emerald-700">
                              Completed
                            </p>
                          ) : !row.isFulfillable ? (
                            <p className="text-right text-[10px] font-medium text-slate-500">
                              Needs approval
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <aside className="order-1 space-y-3 xl:order-2 xl:sticky xl:top-[4.25rem] xl:max-h-[calc(100dvh-5rem)] xl:overflow-auto xl:overscroll-contain">
          <section
            className={cn(
              'rounded-xl border p-3 shadow-sm',
              scannerOpen ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white'
            )}
          >
            <div className="mb-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <ScanBarcode className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  Receiving Scanner
                </h3>
                <p className="text-xs text-slate-600">
                  Camera, manual scan, and receiving save controls.
                </p>
              </div>
              <Badge
                className={cn(
                  'text-[10px]',
                  scannerOpen
                    ? overrunRows.length > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                )}
              >
                {scannerOpen
                  ? overrunRows.length > 0
                    ? 'Quantity Warning'
                    : 'Scanner Active'
                  : 'Scanner Closed'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                size="sm"
                variant={isEditing ? 'outline' : 'default'}
                className={cn(
                  'min-h-11 gap-2 text-xs sm:min-h-9',
                  isEditing
                    ? 'border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                )}
                onClick={toggleEditMode}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {canUseScanner ? (
                <Button
                  type="button"
                  size="sm"
                  variant={scannerOpen ? 'outline' : 'default'}
                  className={cn(
                    'min-h-11 gap-2 text-xs sm:min-h-9',
                    scannerOpen
                      ? 'border-blue-300 text-blue-800 hover:bg-blue-50'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  )}
                  onClick={handleScannerToggle}
                >
                  {scannerOpen ? (
                    <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {scannerOpen ? 'Stop Scanner' : 'Start Receiving Scanner'}
                </Button>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { label: 'Scanned', value: totalScannedUnits, className: 'text-slate-950' },
                { label: 'Required', value: totalPendingUnits, className: 'text-slate-950' },
                { label: 'Left', value: remainingScanUnits, className: 'text-amber-700' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="truncate text-[10px] font-semibold uppercase text-slate-500">
                    {metric.label}
                  </div>
                  <div
                    className={cn('text-base font-black tabular-nums sm:text-lg', metric.className)}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {scannerOpen ? (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Progress</span>
                  <span className="font-black tabular-nums text-slate-950">
                    {totalScannedUnits}/{totalPendingUnits}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      overrunRows.length > 0
                        ? 'bg-rose-500'
                        : scannerCompletionSatisfied
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                    )}
                    style={{
                      width: `${
                        totalPendingUnits > 0
                          ? Math.min(100, Math.round((totalScannedUnits / totalPendingUnits) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs min-[420px]:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-2">
                    <div className="font-semibold text-slate-500">Last Code</div>
                    <div className="truncate font-bold text-slate-950">
                      {lastReceivingScan?.code ?? 'Waiting for scan'}
                    </div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <div className="font-semibold text-slate-500">Last Match</div>
                    <div
                      className={cn(
                        'truncate font-bold',
                        lastReceivingScan?.status === 'not-found'
                          ? 'text-amber-700'
                          : 'text-slate-950'
                      )}
                    >
                      {lastReceivingScan?.label ?? 'No scan yet'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={cn(
                'mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold',
                overrunRows.length > 0
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : scannerCompletionSatisfied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
              )}
            >
              {overrunRows.length > 0 ? (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              ) : scannerCompletionSatisfied ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              {overrunRows.length > 0
                ? `${overrunRows.length} over quantity`
                : scannerCompletionSatisfied
                  ? 'Ready To Complete'
                  : scannerOpen
                    ? 'Scanning'
                    : 'Awaiting Receiving'}
            </div>

            {scannerOpen && canUseScanner ? (
              <div className="mt-3">
                <BarcodeScanner
                  className="border-slate-900"
                  feedback={scanner.feedback}
                  flashKey={scanner.flashKey}
                  onScan={(code, source) => {
                    scanner.submitScan(code, source);
                  }}
                  open={scannerOpen}
                  scanLocked={scanner.scanLocked}
                />
              </div>
            ) : null}

            {isEditing ? (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Selected To Save</span>
                  <span className="font-black tabular-nums text-slate-950">
                    {selectedUnits} Units
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Every receiving save remains recorded with per-item quantities.
                </p>
                {scannerOpen && !scannerCompletionSatisfied && selectedRows.length > 0 ? (
                  <p className="text-xs font-medium text-amber-700">
                    Complete the scanner count before saving receiving.
                  </p>
                ) : null}
                <Button
                  type="button"
                  className="min-h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:min-h-9"
                  disabled={
                    isGenerating ||
                    selectedRows.length === 0 ||
                    hasValidationErrors ||
                    (scannerOpen && !scannerCompletionSatisfied)
                  }
                  onClick={handleGenerate}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isGenerating ? 'Saving…' : scannerOpen ? 'Complete Receiving' : 'Save Receiving'}
                </Button>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-slate-600" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Receiving Audit</h3>
                  <p className="text-xs text-slate-500">{generations.length} records</p>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="min-h-10 gap-1.5 border-slate-300 px-2 text-[11px] text-slate-700 hover:bg-slate-50 min-[420px]:min-h-8"
              >
                <Link href={`/purchase-orders/${order.orderId}/fulfillment/history`}>
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  View Full History
                </Link>
              </Button>
            </div>

            {generationsLoading ? (
              <p className="text-sm text-slate-500">Loading receiving history…</p>
            ) : generations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                No receiving records have been recorded for this purchase order yet.
              </div>
            ) : (
              <div className="space-y-2">
                {generations.slice(0, 5).map((generation) => (
                  <div
                    key={generation.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                  >
                    <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-950">
                          {getFulfillmentRecordLabel(order.orderId, {
                            invoiceId: generation.id,
                            generationNumber: generation.generationNumber,
                          })}
                        </div>
                        <div className="truncate text-[10px] text-slate-500">
                          {formatOrderDateTime(generation.createdDate)} •{' '}
                          {generation.createdBy || 'System'}
                        </div>
                      </div>
                      {generation.id ? (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-9 shrink-0 gap-1 bg-slate-800 px-2 text-[10px] text-white hover:bg-slate-900 min-[420px]:min-h-7"
                        >
                          <Link
                            href={`/purchase-orders/${order.orderId}/fulfillment/history/${generation.id}`}
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            View
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <Badge className="justify-center bg-emerald-100 text-[10px] text-emerald-900">
                        {generation.totalGeneratedQuantity ?? 0} Received
                      </Badge>
                      <Badge className="justify-center bg-amber-100 text-[10px] text-amber-900">
                        {generation.totalBacklogQuantity ?? 0} Left
                      </Badge>
                    </div>
                    {generation.items?.length ? (
                      <div className="mt-2 space-y-1">
                        {generation.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id ?? `${generation.id}-${item.orderDetailId}`}
                            className="rounded-md bg-white px-2 py-1 text-[10px]"
                          >
                            <div className="truncate font-semibold text-slate-800">
                              {item.productName || item.sku || `Order item #${item.orderDetailId}`}
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-slate-500">
                              <span>
                                Ordered{' '}
                                {originalOrderQuantityByOrderDetailId.get(
                                  item.orderDetailId ?? -1
                                ) ?? 0}
                              </span>
                              <span>Received {item.deliveredQuantity ?? 0}</span>
                              <span>Left {item.remainingBacklogQuantity ?? 0}</span>
                            </div>
                          </div>
                        ))}
                        {generation.items.length > 3 ? (
                          <div className="text-[10px] font-medium text-slate-500">
                            +{generation.items.length - 3} more lines
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
                {generations.length > 5 ? (
                  <div className="text-center text-[11px] font-medium text-slate-500">
                    Showing latest 5 of {generations.length}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
