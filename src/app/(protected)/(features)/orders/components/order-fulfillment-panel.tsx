'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, PackageCheck, Sparkles } from 'lucide-react';
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
import { TableRowActions } from '@/entity-library/components/tables/TableRowActions';
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';
import { useGetAllProductCatalogs } from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas';
import {
  useCreateOrderFulfillmentGeneration,
  useGetOrderFulfillmentGenerations,
} from '@/core/api/order-fulfillment-generations';
import type { OrderDetailItem, OrderRecord } from '../data/order-data';
import { useUpdateOrderDetailStatus } from '../api/order-detail-status';
import { useOrderFulfillmentStocks } from '../hooks/use-order-fulfillment-stocks';
import { BackToManagerDialog } from './back-to-manager-dialog';
import { getFulfillmentRecordLabel } from './order-fulfillment-utils';

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

const mergeDraftStateWithItems = (
  items: OrderDetailItem[],
  current: FulfillmentDraftState
): FulfillmentDraftState => {
  const nextDraft = createInitialDraftState(items);

  return Object.fromEntries(
    Object.entries(nextDraft).map(([orderDetailId, draft]) => {
      const currentDraft = current[Number(orderDetailId)];

      return [
        orderDetailId,
        {
          ...draft,
          selected: currentDraft?.selected ?? draft.selected,
          quantity: currentDraft?.quantity ?? draft.quantity,
          picked: draft.picked || (currentDraft?.picked ?? false),
          packed: draft.packed || (currentDraft?.packed ?? false),
        },
      ];
    })
  );
};

const canTransitionToPickPack = (item: OrderDetailItem) =>
  item.itemStatusCode === 'APPROVED' || item.itemStatusCode === 'PENDING';

const isTerminalItem = (item: OrderDetailItem) =>
  item.itemStatusCode === 'COMPLETED' || item.itemStatusCode === 'CANCELLED';

function getCatalogItemNames(
  catalog: ProductCatalogDTO | undefined,
  fallbackProductName: string | undefined
) {
  const productName = catalog?.product?.name ?? fallbackProductName;
  const variants = [...(catalog?.variants ?? [])].sort((left, right) =>
    (left.sku ?? '').localeCompare(right.sku ?? '')
  );

  if (variants.length > 0) {
    return variants.map((variant) => {
      const sku = variant.sku?.trim();

      if (productName && sku) {
        return `${productName} - ${sku}`;
      }

      return sku || productName || 'Catalog item';
    });
  }

  return [productName || 'Catalog item'];
}

export function OrderFulfillmentPanel({ order }: { order: OrderRecord }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(true);
  const [backToManagerItem, setBackToManagerItem] = useState<{
    orderItemId: number;
    orderId: number;
  } | null>(null);
  const [draftState, setDraftState] = useState<FulfillmentDraftState>(() =>
    createInitialDraftState(order.items)
  );
  const allItems = useMemo(() => {
    if (order.orderStatus !== 'Partially Approved') {
      return order.items;
    }

    return order.items.filter((item) =>
      ['APPROVED', 'PICKED', 'PACKED'].includes(item.itemStatusCode ?? '')
    );
  }, [order.items, order.orderStatus]);
  const pendingItems = useMemo(
    () =>
      order.items.filter(
        (item) => Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity) > 0
      ),
    [order.items]
  );
  const totalPendingUnits = useMemo(
    () =>
      pendingItems.reduce(
        (sum, item) => sum + Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity),
        0
      ),
    [pendingItems]
  );
  const catalogIds = useMemo(
    () =>
      Array.from(
        new Set(
          order.items
            .map((item) => item.productCatalogId)
            .filter(
              (productCatalogId): productCatalogId is number => typeof productCatalogId === 'number'
            )
        )
      ).sort((left, right) => left - right),
    [order.items]
  );
  const catalogQueryParams = useMemo(
    () =>
      catalogIds.length > 0
        ? {
            'id.in': catalogIds,
            size: catalogIds.length,
            sort: ['id,asc'],
          }
        : undefined,
    [catalogIds]
  );
  const { data: catalogs = [] } = useGetAllProductCatalogs(catalogQueryParams, {
    query: {
      enabled: catalogIds.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  });
  const catalogById = useMemo(() => {
    const map = new Map<number, ProductCatalogDTO>();

    catalogs.forEach((catalog) => {
      if (typeof catalog.id === 'number') {
        map.set(catalog.id, catalog);
      }
    });

    return map;
  }, [catalogs]);
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
  const { data: generations = [] } = useGetOrderFulfillmentGenerations(order.orderId);
  const { mutateAsync: createGeneration, isPending: isGenerating } =
    useCreateOrderFulfillmentGeneration();
  const { mutateAsync: updateOrderDetailStatus, isPending: isUpdatingStatus } =
    useUpdateOrderDetailStatus();
  const canFulfillOrder =
    order.orderStatus === 'Approved' ||
    order.orderStatus === 'Partially Approved' ||
    order.orderStatus === 'Pending';

  useEffect(() => {
    setDraftState((current) => mergeDraftStateWithItems(order.items, current));
    setIsEditing(true);
  }, [order.items]);

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
    nextValue: Partial<{
      selected: boolean;
      quantity: string;
      picked: boolean;
      packed: boolean;
    }>
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
      toast.error('Select at least one pending item and enter a fulfillment quantity.');

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
      setIsEditing(true);
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
      setIsEditing(true);
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
      setIsEditing(true);
      toast.success('Item marked packed.');
    } catch (error) {
      updateDraftState(row.item.orderDetailId, { packed: false });
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="min-w-0 space-y-3 overflow-x-clip bg-slate-50 p-2 sm:p-3">
      <BackToManagerDialog
        open={backToManagerItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBackToManagerItem(null);
          }
        }}
        orderItemId={backToManagerItem?.orderItemId ?? null}
        orderId={backToManagerItem?.orderId}
      />
      {!canFulfillOrder ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This order must be approved, partially approved or pending before Picker/Packer
          fulfillment can be saved.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3">
        <section className="order-2 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-cyan-300">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-950">Pick & Pack Lines</h2>
                <p className="truncate text-xs text-slate-500">
                  Fulfill sale order quantities with warehouse stock checks.
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
              {hasSelectedRowsMissingPickPack ? (
                <Badge className="bg-amber-100 text-[11px] text-amber-900">
                  Pick/Pack Required
                </Badge>
              ) : null}
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="m-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No order items are available for fulfillment.
            </div>
          ) : (
            <div className="max-w-full overflow-auto overscroll-contain max-sm:max-h-[70dvh] sm:max-h-[calc(100dvh-15rem)]">
              <Table className="min-w-[1120px] text-xs sm:min-w-[1280px]">
                <TableHeader className="sticky top-0 z-20 shadow-sm">
                  <TableRow className="border-b border-slate-200 bg-slate-100">
                    {isEditing ? (
                      <TableHead className="w-10 bg-slate-100 text-center text-[10px] uppercase">
                        Select
                      </TableHead>
                    ) : null}
                    <TableHead className="sticky left-0 z-30 min-w-[220px] bg-slate-100 text-[10px] uppercase sm:min-w-[300px]">
                      Item / SKU
                    </TableHead>
                    <TableHead className="min-w-[130px] text-center text-[10px] uppercase">
                      Warehouse
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Order Qty</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Delivered</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Remaining</TableHead>
                    <TableHead className="text-right text-[10px] uppercase">Stock</TableHead>
                    <TableHead className="min-w-[130px] text-center text-[10px] uppercase">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[180px] text-[10px] uppercase">Comment</TableHead>
                    <TableHead className="text-center text-[10px] uppercase">Picked</TableHead>
                    <TableHead className="text-center text-[10px] uppercase">Packed</TableHead>
                    <TableHead className="min-w-[170px] text-right text-[10px] uppercase">
                      Fulfill
                    </TableHead>
                    <TableHead className="w-16 text-center text-[10px] uppercase">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => {
                    const backlogResolved = row.isCompleted;
                    const availableStockLabel =
                      typeof row.item.variantId === 'number'
                        ? 'Warehouse main stock'
                        : 'Product main stock';
                    const isLegacyCatalog =
                      Boolean(row.item.productCatalogId) && !row.item.variantId;
                    const catalog =
                      isLegacyCatalog && typeof row.item.productCatalogId === 'number'
                        ? catalogById.get(row.item.productCatalogId)
                        : undefined;
                    const catalogItemNames = isLegacyCatalog
                      ? getCatalogItemNames(catalog, row.item.productName)
                      : [];
                    const displayNames =
                      catalogItemNames.length > 0
                        ? catalogItemNames
                        : [row.item.productName || row.item.sku || `Item #${index + 1}`];

                    return displayNames.map((displayName, displayIndex) => (
                      <TableRow
                        key={`${row.item.orderDetailId}-${displayIndex}`}
                        className={cn(
                          'h-12 border-b border-slate-100',
                          backlogResolved && 'bg-slate-50 text-slate-500',
                          isEditing && row.selected && 'bg-cyan-50/70'
                        )}
                      >
                        {isEditing && displayIndex === 0 ? (
                          <TableCell
                            rowSpan={displayNames.length}
                            className="text-center align-top"
                          >
                            <div className="pt-1">
                              <Checkbox
                                aria-label={`Select ${displayName} for fulfillment`}
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
                            </div>
                          </TableCell>
                        ) : null}
                        <TableCell
                          className={cn(
                            'sticky left-0 z-10 bg-white align-middle shadow-[1px_0_0_0_rgba(226,232,240,1)]',
                            row.isCompleted && 'bg-slate-50',
                            isEditing && row.selected && 'bg-cyan-50'
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white sm:h-6 sm:w-6">
                                {displayNames.length > 1
                                  ? `${index + 1}.${displayIndex + 1}`
                                  : index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-950">
                                  {displayName}
                                </div>
                                <div className="mt-1 flex min-w-0 flex-wrap gap-1">
                                  {row.item.productCatalogId ? (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 bg-slate-100 px-1.5 text-[10px] text-slate-700"
                                    >
                                      Catalog item
                                    </Badge>
                                  ) : row.item.sku ? (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 max-w-[130px] truncate bg-slate-100 px-1.5 text-[10px] text-slate-700"
                                    >
                                      {row.item.sku}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            {!row.item.productCatalogId && row.item.variantAttributes ? (
                              <p className="truncate pl-9 text-[10px] text-blue-700">
                                {row.item.variantAttributes}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        {displayIndex === 0 ? (
                          <>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-center font-medium text-slate-800"
                            >
                              <span className="line-clamp-2">
                                {typeof row.item.warehouseId === 'number'
                                  ? (warehouseNameById.get(row.item.warehouseId) ??
                                    `Warehouse ${row.item.warehouseId}`)
                                  : '—'}
                              </span>
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-right font-semibold tabular-nums text-slate-900"
                            >
                              {row.originalOrderQuantity}
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-right font-semibold tabular-nums text-emerald-700"
                            >
                              {row.deliveredQuantity}
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-right font-semibold tabular-nums text-amber-700"
                            >
                              {row.remainingQuantity}
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-right font-semibold tabular-nums text-slate-900"
                            >
                              <div>{stocksLoading ? '...' : row.availableQuantity}</div>
                              <div className="text-[11px] text-slate-500">
                                {availableStockLabel}
                              </div>
                            </TableCell>
                            <TableCell rowSpan={displayNames.length} className="text-center">
                              <Badge
                                className={cn(
                                  'h-5 px-1.5 text-[10px]',
                                  row.isCompleted
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : row.canChangePickPack
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-100 text-slate-800'
                                )}
                              >
                                {row.item.itemStatus}
                              </Badge>
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="align-middle text-xs text-slate-700"
                            >
                              <span className="line-clamp-2">
                                {row.item.itemComment?.trim() ? row.item.itemComment : '—'}
                              </span>
                            </TableCell>
                            <TableCell rowSpan={displayNames.length} className="text-center">
                              <Checkbox
                                aria-label={`Mark ${displayName} picked`}
                                checked={row.picked}
                                disabled={
                                  !isEditing ||
                                  !row.selected ||
                                  row.isTerminalStatus ||
                                  !row.canChangePickPack ||
                                  isUpdatingStatus
                                }
                                onCheckedChange={(checked) =>
                                  handlePickedChange(row, checked === true)
                                }
                                className="mx-auto data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                              />
                            </TableCell>
                            <TableCell rowSpan={displayNames.length} className="text-center">
                              <Checkbox
                                aria-label={`Mark ${displayName} packed`}
                                checked={row.packed}
                                disabled={
                                  !isEditing ||
                                  !row.selected ||
                                  row.isTerminalStatus ||
                                  (!row.canChangePickPack &&
                                    row.item.itemStatusCode !== 'PICKED') ||
                                  isUpdatingStatus
                                }
                                onCheckedChange={(checked) =>
                                  handlePackedChange(row, checked === true)
                                }
                                className="mx-auto data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                              />
                            </TableCell>
                            <TableCell rowSpan={displayNames.length} className="align-top">
                              <div className="ml-auto max-w-[150px] space-y-1">
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      row.isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'
                                    )}
                                    style={{
                                      width: `${
                                        row.originalOrderQuantity > 0
                                          ? Math.min(
                                              100,
                                              Math.round(
                                                (row.deliveredQuantity /
                                                  row.originalOrderQuantity) *
                                                  100
                                              )
                                            )
                                          : 100
                                      }%`,
                                    }}
                                  />
                                </div>
                                {isEditing ? (
                                  <Input
                                    aria-label={`Fulfill quantity for ${displayName}`}
                                    name={`fulfillQuantity-${row.item.orderDetailId}`}
                                    autoComplete="off"
                                    inputMode="numeric"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={row.quantity}
                                    disabled={
                                      !row.selected ||
                                      row.isCompleted ||
                                      row.deliverableQuantity === 0
                                    }
                                    onChange={(event) =>
                                      updateDraftState(row.item.orderDetailId, {
                                        quantity: event.target.value,
                                      })
                                    }
                                    className="h-10 border-slate-300 text-right text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-cyan-300 sm:h-8 sm:text-xs"
                                  />
                                ) : (
                                  <div className="text-right text-xs font-semibold text-slate-400">
                                    —
                                  </div>
                                )}
                                <div className="text-right text-[10px] font-semibold tabular-nums text-slate-500">
                                  {row.enteredQuantity}/{row.remainingQuantity} To Fulfill
                                </div>
                                {row.validationMessage ? (
                                  <p className="text-right text-[10px] font-medium text-rose-600">
                                    {row.validationMessage}
                                  </p>
                                ) : row.isCompleted ? (
                                  <p className="text-right text-[10px] font-medium text-emerald-700">
                                    Completed
                                  </p>
                                ) : row.deliverableQuantity === 0 ? (
                                  <p className="text-right text-[10px] font-medium text-amber-700">
                                    No inventory
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell
                              rowSpan={displayNames.length}
                              className="text-center align-top"
                            >
                              <TableRowActions
                                row={row}
                                actions={[
                                  {
                                    id: 'mark-picked',
                                    label: 'Mark picked',
                                    onClick: async (selectedRow: (typeof rows)[number]) => {
                                      await handlePickedChange(selectedRow, true);
                                    },
                                  },
                                  {
                                    id: 'mark-packed',
                                    label: 'Mark packed',
                                    onClick: async (selectedRow: (typeof rows)[number]) => {
                                      await handlePackedChange(selectedRow, true);
                                    },
                                  },
                                  {
                                    id: 'back-to-manager',
                                    label: 'Back to Manager',
                                    onClick: (selectedRow: (typeof rows)[number]) => {
                                      setBackToManagerItem({
                                        orderItemId: selectedRow.item.orderDetailId,
                                        orderId: selectedRow.item.orderId,
                                      });
                                    },
                                  },
                                ]}
                              />
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <aside className="order-1">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <PackageCheck className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                  Fulfillment Control
                </h3>
                <p className="text-xs text-slate-600">Pick, pack, and save selected lines.</p>
              </div>
              <Badge
                className={cn(
                  'text-[10px]',
                  canSaveFulfillment
                    ? 'bg-emerald-600 text-white'
                    : isEditing
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-800'
                )}
              >
                {canSaveFulfillment ? 'Ready To Save' : isEditing ? 'Editing' : 'Review'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                size="sm"
                variant={isEditing ? 'outline' : 'default'}
                className={cn(
                  'min-h-11 gap-2 text-xs sm:min-h-9',
                  !canFulfillOrder ? 'cursor-not-allowed border-slate-200 text-slate-400' : '',
                  isEditing
                    ? 'border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                )}
                disabled={!canFulfillOrder}
                onClick={toggleEditMode}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                type="button"
                className="min-h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:min-h-9"
                disabled={
                  isGenerating || hasValidationErrors || !canFulfillOrder || !canSaveFulfillment
                }
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {isGenerating ? 'Saving...' : 'Save Fulfillment'}
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { label: 'Selected', value: selectedUnits, className: 'text-slate-950' },
                { label: 'Pending', value: totalPendingUnits, className: 'text-amber-700' },
                { label: 'Records', value: generations.length, className: 'text-slate-950' },
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

            {isEditing ? (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Selected To Generate</span>
                  <span className="font-black tabular-nums text-slate-950">
                    {selectedUnits} Units
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Every fulfillment generation remains recorded with per-item quantities.
                </p>
                {selectedRows.length > 0 && !canSaveFulfillment ? (
                  <p className="text-xs font-medium text-amber-700">
                    Each selected row must have both Picked and Packed checked before fulfillment
                    can be saved.
                  </p>
                ) : null}
                {hasValidationErrors ? (
                  <p className="text-xs font-medium text-rose-700">
                    Requested quantity exceeds the deliverable inventory for one or more items.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
