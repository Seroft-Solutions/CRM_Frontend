'use client';

import { Fragment, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft, ChevronDown, ChevronRight, PackageOpen } from 'lucide-react';
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
import { useGetAllProductCatalogs } from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas/ProductCatalogDTO';

type ApprovalDraftState = Record<number, { approvedQuantity: string }>;
type PurchaseApprovalItem = OrderRecord['items'][number];
type ApprovalRow =
  | {
      rowId: string;
      type: 'item';
      item: PurchaseApprovalItem;
      items: PurchaseApprovalItem[];
      originalQty: number;
      approvedQty: number;
      difference: number;
      validationMessage?: string;
    }
  | {
      rowId: string;
      type: 'catalog';
      productCatalogId: number;
      catalogName: string;
      items: PurchaseApprovalItem[];
      originalQty: number;
      approvedQty: number;
      difference: number;
      validationMessage?: string;
    };

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
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [expandedCatalogIds, setExpandedCatalogIds] = useState<Set<number>>(() => new Set());
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
  const catalogIds = useMemo(
    () =>
      Array.from(
        new Set(
          order.items
            .map((item) => item.productCatalogId)
            .filter((id): id is number => typeof id === 'number')
        )
      ).sort((a, b) => a - b),
    [order.items]
  );
  const catalogQueryParams = useMemo(
    () =>
      catalogIds.length > 0
        ? { 'id.in': catalogIds, size: catalogIds.length, sort: ['id,asc'] }
        : undefined,
    [catalogIds]
  );
  const { data: catalogs = [] } = useGetAllProductCatalogs(catalogQueryParams, {
    query: { enabled: catalogIds.length > 0, staleTime: 5 * 60 * 1000 },
  });
  const catalogById = useMemo(() => {
    const nextMap = new Map<number, ProductCatalogDTO>();

    catalogs.forEach((catalog) => {
      if (typeof catalog.id === 'number') {
        nextMap.set(catalog.id, catalog);
      }
    });

    return nextMap;
  }, [catalogs]);

  const rows = useMemo<ApprovalRow[]>(() => {
    const approvableItems = order.items.filter(
      (item) => !item.itemStatusCode || item.itemStatusCode === 'CREATED'
    );
    const catalogItemsById = new Map<number, PurchaseApprovalItem[]>();
    const standaloneItems: PurchaseApprovalItem[] = [];

    approvableItems.forEach((item) => {
      if (typeof item.productCatalogId === 'number') {
        const existingItems = catalogItemsById.get(item.productCatalogId) ?? [];

        existingItems.push(item);
        catalogItemsById.set(item.productCatalogId, existingItems);
      } else {
        standaloneItems.push(item);
      }
    });

    const catalogRows: ApprovalRow[] = Array.from(catalogItemsById.entries()).map(
      ([productCatalogId, items]) => {
        const originalQuantities = items.map(
          (item) => Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity)
        );
        const firstItem = items[0];
        const originalQty = originalQuantities[0] ?? 0;
        const maxAllowedQty = Math.min(...originalQuantities);
        const approvedQty = parsePositiveInteger(
          draftState[firstItem.orderDetailId]?.approvedQuantity ?? '0'
        );
        const difference = originalQty - approvedQty;
        const catalog = catalogById.get(productCatalogId);
        let validationMessage: string | undefined;

        if (approvedQty > maxAllowedQty) {
          validationMessage = `Cannot exceed catalog item quantity (${maxAllowedQty})`;
        }

        return {
          rowId: `catalog-${productCatalogId}`,
          type: 'catalog',
          productCatalogId,
          catalogName:
            catalog?.productCatalogName ||
            firstItem.productName ||
            firstItem.sku ||
            `Catalog #${productCatalogId}`,
          items,
          originalQty,
          approvedQty,
          difference,
          validationMessage,
        };
      }
    );

    const itemRows: ApprovalRow[] = standaloneItems.map((item) => {
      const draft = draftState[item.orderDetailId] ?? { approvedQuantity: '0' };
      const originalQty = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const approvedQty = parsePositiveInteger(draft.approvedQuantity);
      const difference = originalQty - approvedQty;

      let validationMessage: string | undefined;

      if (approvedQty > originalQty) {
        validationMessage = `Cannot exceed original quantity (${originalQty})`;
      }

      return {
        rowId: `item-${item.orderDetailId}`,
        type: 'item',
        item,
        items: [item],
        originalQty,
        approvedQty,
        difference,
        validationMessage,
      };
    });

    return [...catalogRows, ...itemRows];
  }, [catalogById, order.items, draftState]);

  const totalOriginal = rows.reduce((sum, row) => sum + row.originalQty, 0);
  const totalApproved = rows.reduce((sum, row) => sum + row.approvedQty, 0);
  const totalDifference = totalOriginal - totalApproved;
  const hasValidationErrors = rows.some((row) => row.validationMessage);
  const allRowsSelected = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.rowId));
  const selectedRows = rows.filter((row) => selectedRowIds.has(row.rowId));
  const selectedItemIds = new Set(
    selectedRows.flatMap((row) => row.items.map((item) => item.orderDetailId))
  );
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

  const updateCatalogDraftState = (items: PurchaseApprovalItem[], approvedQuantity: string) => {
    setDraftState((current) => {
      const nextState = { ...current };

      items.forEach((item) => {
        nextState[item.orderDetailId] = { approvedQuantity };
      });

      return nextState;
    });
  };

  const toApprovePayloadItems = (approvalRows: ApprovalRow[]) =>
    approvalRows.flatMap((row) =>
      row.items.map((item) => ({
        orderDetailId: item.orderDetailId,
        approvedQuantity: row.approvedQty,
      }))
    );

  const handleApprove = async () => {
    if (hasValidationErrors) {
      toast.error('Please fix validation errors before approving');

      return;
    }

    const items = toApprovePayloadItems(selectedRows);

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

    const items = toApprovePayloadItems(rows);

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
    setSelectedRowIds(checked ? new Set(rows.map((row) => row.rowId)) : new Set());
  };

  const toggleSelectedRow = (rowId: string, checked: boolean) => {
    setSelectedRowIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }

      return next;
    });
  };

  const toggleExpandedCatalog = (productCatalogId: number) => {
    setExpandedCatalogIds((current) => {
      const next = new Set(current);

      if (next.has(productCatalogId)) {
        next.delete(productCatalogId);
      } else {
        next.add(productCatalogId);
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
              const isSelected = selectedRowIds.has(row.rowId);
              const isCatalog = row.type === 'catalog';
              const isExpanded = isCatalog && expandedCatalogIds.has(row.productCatalogId);
              const displayName = isCatalog ? row.catalogName : row.item.productName || 'Unknown';
              const firstItem = row.items[0];

              return (
                <Fragment key={row.rowId}>
                  <TableRow
                    className={cn('hover:bg-slate-50/70', isSelected && 'bg-emerald-50/60')}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          toggleSelectedRow(row.rowId, checked === true)
                        }
                        aria-label={`Select ${displayName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isCatalog ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleExpandedCatalog(row.productCatalogId)}
                            aria-label={
                              isExpanded ? 'Collapse catalog items' : 'Expand catalog items'
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}
                        {isCatalog ? <PackageOpen className="h-4 w-4 text-slate-500" /> : null}
                        <div>
                          <div className="font-medium text-slate-900">{displayName}</div>
                          {isCatalog ? (
                            <div className="text-xs text-slate-500">
                              {row.items.length} synced catalog item
                              {row.items.length === 1 ? '' : 's'}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-600">
                      {isCatalog ? 'Catalog' : row.item.sku || '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-600">
                      {isCatalog ? 'Synced' : row.item.variantAttributes || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-2 font-semibold',
                          isCatalog
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : (itemStatusColors[row.item.itemStatus] ??
                                'bg-slate-100 text-slate-800 border-slate-300')
                        )}
                      >
                        {isCatalog ? 'Catalog' : row.item.itemStatus}
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
                        value={
                          firstItem
                            ? (draftState[firstItem.orderDetailId]?.approvedQuantity ?? '0')
                            : '0'
                        }
                        onChange={(e) =>
                          isCatalog
                            ? updateCatalogDraftState(row.items, e.target.value)
                            : updateDraftState(row.item.orderDetailId, e.target.value)
                        }
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
                  {isCatalog && isExpanded
                    ? row.items.map((item) => (
                        <TableRow
                          key={`${row.rowId}-${item.orderDetailId}`}
                          className="bg-slate-50/70"
                        >
                          <TableCell />
                          <TableCell className="pl-14 text-sm text-slate-700">
                            {item.productName || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {item.sku || '—'}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {item.variantAttributes || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                'border-2 font-semibold',
                                itemStatusColors[item.itemStatus] ??
                                  'bg-slate-100 text-slate-800 border-slate-300'
                              )}
                            >
                              {item.itemStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity)}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {draftState[item.orderDetailId]?.approvedQuantity ?? '0'}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {Math.max(0, item.quantity) +
                              Math.max(0, item.backOrderQuantity) -
                              parsePositiveInteger(
                                draftState[item.orderDetailId]?.approvedQuantity ?? '0'
                              )}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </Fragment>
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
