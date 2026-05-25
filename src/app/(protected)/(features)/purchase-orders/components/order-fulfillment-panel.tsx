'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Camera,
  CameraOff,
  Pencil,
  PackageCheck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getFulfillmentRecordLabel } from './order-fulfillment-utils';

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
const ALL_WAREHOUSES_FILTER = '__all__';

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
  const [manualScanCode, setManualScanCode] = useState('');
  const [draftState, setDraftState] = useState<FulfillmentDraftState>(() =>
    createInitialDraftState(order.items)
  );
  const [warehouseFilter, setWarehouseFilter] = useState(ALL_WAREHOUSES_FILTER);
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
  const { data: generations = [] } = useGetPurchaseOrderFulfillmentGenerations(order.orderId);
  const { mutateAsync: createGeneration, isPending: isGenerating } =
    useCreatePurchaseOrderFulfillmentGeneration();

  useEffect(() => {
    setDraftState(createInitialDraftState(order.items));
    setIsEditing(false);
    setScannerOpen(false);
    setLastReceivingScan(null);
    setWarehouseFilter(ALL_WAREHOUSES_FILTER);
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
  const getWarehouseLabel = (warehouseId?: number) =>
    typeof warehouseId === 'number'
      ? (warehouseNameById.get(warehouseId) ?? `Warehouse ${warehouseId}`)
      : '—';

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
  const warehouseFilterOptions = useMemo(() => {
    const optionsByName = new Map<string, string>();

    allItems.forEach((item) => {
      const warehouseName = getWarehouseLabel(item.warehouseId);

      if (warehouseName === '—') {
        return;
      }

      const normalizedName = warehouseName.trim().toLowerCase();

      if (!optionsByName.has(normalizedName)) {
        optionsByName.set(normalizedName, warehouseName);
      }
    });

    return Array.from(optionsByName.values()).sort((left, right) => left.localeCompare(right));
  }, [allItems, warehouseNameById]);
  const visibleRows = useMemo(
    () =>
      warehouseFilter === ALL_WAREHOUSES_FILTER
        ? rows
        : rows.filter((row) => getWarehouseLabel(row.item.warehouseId) === warehouseFilter),
    [rows, warehouseFilter, warehouseNameById]
  );

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
  const scanProgressPercent =
    totalPendingUnits > 0
      ? Math.min(100, Math.round((totalScannedUnits / totalPendingUnits) * 100))
      : 0;

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

  const handleManualReceivingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = manualScanCode.trim();

    if (!code) return;

    scanner.submitScan(code, 'manual');
    setManualScanCode('');
  };

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
      <div className="grid min-w-0 gap-3">
        <section className="order-2 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-emerald-300">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-950">
                  Receiving Lines ({allItems.length})
                </h2>
                <p className="truncate text-xs text-slate-500">
                  Match received units to PO quantities and warehouse stock.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 min-[520px]:flex min-[520px]:flex-wrap min-[520px]:items-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10 gap-1.5 border-slate-300 px-3 text-xs text-slate-800 hover:bg-slate-50 sm:min-h-9"
                disabled={!isEditing}
                onClick={toggleEditMode}
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isEditing ? 'outline' : 'default'}
                className={cn(
                  'min-h-10 gap-1.5 px-3 text-xs sm:min-h-9',
                  isEditing
                    ? 'border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                )}
                onClick={() => {
                  if (!isEditing) {
                    toggleEditMode();
                  }
                }}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </Button>
              {canUseScanner ? (
                <Button
                  type="button"
                  size="sm"
                  variant={scannerOpen ? 'outline' : 'default'}
                  className={cn(
                    'col-span-2 min-h-10 gap-1.5 px-3 text-xs min-[520px]:col-span-1 sm:min-h-9',
                    scannerOpen
                      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  )}
                  onClick={handleScannerToggle}
                >
                  {scannerOpen ? (
                    <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {scannerOpen ? 'Stop Receiving Scanner' : 'Start Receiving Scanner'}
                </Button>
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
                    <TableHead className="min-w-[150px] bg-slate-100 text-center text-[10px] uppercase">
                      <div className="flex flex-col items-center gap-1">
                        <span>Warehouse</span>
                        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                          <SelectTrigger
                            aria-label="Filter by warehouse"
                            className="h-7 w-[140px] border-slate-300 bg-white px-2 text-[11px] normal-case"
                          >
                            <SelectValue placeholder="All warehouses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL_WAREHOUSES_FILTER}>All warehouses</SelectItem>
                            {warehouseFilterOptions.map((warehouseName) => (
                              <SelectItem key={warehouseName} value={warehouseName}>
                                {warehouseName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isEditing ? 8 : 7} className="h-24 text-center">
                        <p className="text-sm text-slate-500">
                          No receiving items match the selected warehouse.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, index) => (
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
                            {getWarehouseLabel(row.item.warehouseId)}
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
                              <div className="text-right text-xs font-semibold text-slate-400">
                                —
                              </div>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="grid gap-3 border-t border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,32%)] md:items-center">
            <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  Items Selected
                </div>
                <div className="text-lg font-black tabular-nums text-slate-950">
                  {selectedRows.length}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  Units Selected
                </div>
                <div className="text-lg font-black tabular-nums text-slate-950">
                  {selectedUnits}
                </div>
              </div>
            </div>
            <Button
              type="button"
              className="min-h-12 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={
                isGenerating ||
                selectedRows.length === 0 ||
                hasValidationErrors ||
                (scannerOpen && !scannerCompletionSatisfied)
              }
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isGenerating ? 'Saving…' : 'Submit Receiving'}
            </Button>
          </div>
        </section>

        <aside className="order-1">
          <section
            className={cn(
              'overflow-hidden rounded-xl border bg-white shadow-sm',
              scannerOpen ? 'border-emerald-300' : 'border-slate-200'
            )}
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-emerald-300">
                  <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-950">Receiving Scanner</h3>
                  <p className="truncate text-xs text-slate-600">
                    Scan barcode / SKU or enter manually to receive items.
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  'h-6 w-fit text-[10px]',
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

            <div className="grid gap-3 p-3 lg:grid-cols-[minmax(260px,2fr)_minmax(0,3fr)]">
              <div className="min-w-0 space-y-2">
                {scannerOpen && canUseScanner ? (
                  <BarcodeScanner
                    compact
                    className="border-slate-900 shadow-none"
                    feedback={scanner.feedback}
                    flashKey={scanner.flashKey}
                    onScan={(code, source) => {
                      scanner.submitScan(code, source);
                    }}
                    open={scannerOpen}
                    scanLocked={scanner.scanLocked}
                    showHeader={false}
                    showManualEntry={false}
                    showSupportedTargets={false}
                  />
                ) : (
                  <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 p-4 text-center sm:h-[170px]">
                    <Camera className="mb-2 h-7 w-7 text-slate-500" aria-hidden="true" />
                    <div className="text-sm font-bold text-slate-950">Camera Ready</div>
                    <div className="mt-1 max-w-xs text-xs text-slate-500">
                      Start Receiving Scanner to request camera permission and show the preview.
                    </div>
                  </div>
                )}

                <form onSubmit={handleManualReceivingSubmit} className="space-y-2">
                  <label
                    htmlFor="purchase-receiving-manual-code"
                    className="text-xs font-bold text-slate-700"
                  >
                    Manual Barcode / SKU
                  </label>
                  <div className="grid gap-2 min-[520px]:grid-cols-[minmax(0,1fr)_150px]">
                    <Input
                      id="purchase-receiving-manual-code"
                      name="purchaseReceivingManualCode"
                      value={manualScanCode}
                      onChange={(event) => setManualScanCode(event.target.value)}
                      placeholder="Enter barcode or SKU…"
                      autoComplete="off"
                      spellCheck={false}
                      className="min-h-11 border-slate-300 text-sm focus-visible:ring-2 focus-visible:ring-emerald-300 sm:min-h-9"
                      disabled={scanner.scanLocked}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="min-h-11 border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 sm:min-h-9"
                      disabled={!manualScanCode.trim() || scanner.scanLocked}
                    >
                      Add / Match Item
                    </Button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
                  {canUseScanner ? (
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11 gap-2 bg-blue-700 text-xs text-white hover:bg-blue-800 sm:min-h-9"
                      disabled={scannerOpen}
                      onClick={handleScannerToggle}
                    >
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                      Start Receiving Scanner
                    </Button>
                  ) : null}
                  {canUseScanner ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 gap-2 border-rose-200 text-xs text-rose-700 hover:bg-rose-50 sm:min-h-9"
                      disabled={!scannerOpen}
                      onClick={handleScannerToggle}
                    >
                      <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Stop Receiving Scanner
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-950">Supported Target</div>
                    <div className="text-xs text-slate-500">
                      Scan progress against open purchase-order receiving quantity.
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'w-fit text-[10px]',
                      scannerOpen
                        ? overrunRows.length > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    )}
                  >
                    {scannerOpen
                      ? overrunRows.length > 0
                        ? 'Quantity Warning'
                        : 'Scanner Active'
                      : 'Scanner Closed'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Scanned Units',
                      value: totalScannedUnits,
                      className: 'text-emerald-700',
                    },
                    {
                      label: 'Required Units',
                      value: totalPendingUnits,
                      className: 'text-blue-700',
                    },
                    {
                      label: 'Remaining Units',
                      value: remainingScanUnits,
                      className: 'text-orange-700',
                    },
                    {
                      label: 'Progress',
                      value: `${scanProgressPercent}%`,
                      className: 'text-slate-950',
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="truncate text-[10px] font-semibold uppercase text-slate-500">
                        {metric.label}
                      </div>
                      <div
                        className={cn(
                          'mt-1 text-xl font-black tabular-nums sm:text-2xl',
                          metric.className
                        )}
                      >
                        {metric.value}
                      </div>
                      {metric.label === 'Progress' ? (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              overrunRows.length > 0
                                ? 'bg-rose-500'
                                : scannerCompletionSatisfied
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-600'
                            )}
                            style={{ width: `${scanProgressPercent}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 min-[620px]:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">
                      Last Scanned
                    </div>
                    <div className="mt-1 truncate text-sm font-bold text-slate-950">
                      {lastReceivingScan?.code ?? 'Waiting for scan'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">
                      Last Matched Item
                    </div>
                    <div
                      className={cn(
                        'mt-1 truncate text-sm font-bold',
                        lastReceivingScan?.status === 'not-found'
                          ? 'text-amber-700'
                          : 'text-slate-950'
                      )}
                    >
                      {lastReceivingScan?.label ?? 'No scan yet'}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold',
                    overrunRows.length > 0
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : scannerCompletionSatisfied
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700'
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
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
