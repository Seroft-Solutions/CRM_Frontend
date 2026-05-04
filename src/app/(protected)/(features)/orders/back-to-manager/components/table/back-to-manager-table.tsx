'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageCheck, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableRowActions } from '@/entity-library/components/tables/TableRowActions';
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';
import { getOrderFulfillmentGenerations } from '@/core/api/order-fulfillment-generations';
import {
  type OrderItem,
  useGetOrderItemsByStatus,
  useUpdateOrderItemStatus,
} from '@/core/api/order-items';
import { useOrderFulfillmentStocks } from '@/app/(protected)/(features)/orders/hooks/use-order-fulfillment-stocks';
import type { OrderDetailItem } from '@/app/(protected)/(features)/orders/data/order-data';

const getComment = (item: OrderItem) => item.comment || item.itemComment || '';

const getItemStatusLabel = (status?: OrderItem['itemStatus']) => {
  if (!status) {
    return 'Unknown';
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
};

const toFulfillmentItem = (item: OrderItem): OrderDetailItem => ({
  orderDetailId: item.id ?? 0,
  orderId: item.orderId ?? 0,
  productId: item.productId,
  variantId: item.variantId,
  productCatalogId: item.productCatalogId,
  warehouseId: item.warehouseId,
  productName: item.productName,
  sku: item.sku,
  variantAttributes: item.variantAttributes,
  itemStatus: getItemStatusLabel(item.itemStatus) as OrderDetailItem['itemStatus'],
  itemStatusCode: item.itemStatus,
  itemTotalAmount: item.itemTotalAmount ?? 0,
  quantity: item.quantity ?? 0,
  backOrderQuantity: item.backOrderQuantity ?? 0,
  itemPrice: item.itemPrice ?? 0,
  itemTaxAmount: 0,
  itemComment: getComment(item),
  createdBy: item.createdBy ?? '',
  createdDate: item.createdDate ?? '',
  updatedBy: item.lastModifiedBy,
  lastUpdated: item.lastModifiedDate,
});

export function BackToManagerTable() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');

  const queryParams = useMemo(
    () => ({
      page: 0,
      size: 500,
      sort: ['createdDate,desc'],
      dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
      productName: productSearch || undefined,
      comment: commentSearch || undefined,
    }),
    [commentSearch, dateFrom, dateTo, productSearch]
  );

  const {
    data: issueItems = [],
    isLoading,
    isError,
    refetch,
  } = useGetOrderItemsByStatus('ISSUE', queryParams);
  const { mutateAsync: updateOrderItemStatus, isPending } = useUpdateOrderItemStatus();
  const fulfillmentItems = useMemo(() => issueItems.map(toFulfillmentItem), [issueItems]);
  const { stockByItemId, isLoading: stocksLoading } = useOrderFulfillmentStocks(fulfillmentItems);
  const { data: warehouseRows = [] } = useWarehousesQuery({
    page: 0,
    size: 1000,
    sort: ['name,asc'],
    'status.equals': 'ACTIVE',
  });

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

  const orderIds = useMemo(
    () =>
      Array.from(
        new Set(
          issueItems.map((item) => item.orderId).filter((orderId): orderId is number => orderId > 0)
        )
      ),
    [issueItems]
  );

  const fulfillmentGenerationQueries = useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: [`/api/orders/${orderId}/fulfillment-generations`],
      queryFn: ({ signal }) => getOrderFulfillmentGenerations(orderId, signal),
      enabled: orderId > 0,
      staleTime: 30_000,
    })),
  });

  const deliveredQuantityByOrderDetailId = useMemo(() => {
    const deliveredMap = new Map<number, number>();

    fulfillmentGenerationQueries.forEach((query) => {
      query.data?.forEach((generation) => {
        generation.items?.forEach((generationItem) => {
          if (typeof generationItem.orderDetailId !== 'number') {
            return;
          }

          deliveredMap.set(
            generationItem.orderDetailId,
            (deliveredMap.get(generationItem.orderDetailId) ?? 0) +
              Math.max(0, generationItem.deliveredQuantity ?? 0)
          );
        });
      });
    });

    return deliveredMap;
  }, [fulfillmentGenerationQueries]);

  const rows = useMemo(
    () =>
      fulfillmentItems.map((item, index) => {
        const remainingQuantity = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
        const deliveredQuantity = deliveredQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;
        const stockSnapshot = stockByItemId.get(item.orderDetailId) ?? {
          availableQuantity: 0,
          deliverableQuantity: 0,
        };

        return {
          item,
          originalOrderQuantity: remainingQuantity + deliveredQuantity,
          remainingQuantity,
          deliveredQuantity,
          availableQuantity: stockSnapshot.availableQuantity,
          sourceItem: issueItems[index] ?? {
            id: item.orderDetailId,
            orderId: item.orderId,
            itemStatus: 'ISSUE' as const,
          },
        };
      }),
    [deliveredQuantityByOrderDetailId, fulfillmentItems, issueItems, stockByItemId]
  );

  const approveItem = async (item: OrderItem) => {
    if (!item.id) {
      return;
    }

    await updateOrderItemStatus({
      orderDetailId: item.id,
      newStatus: 'APPROVED',
      orderId: item.orderId,
    });
    toast.success('Item approved');
    void refetch();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <Input
          value={productSearch}
          placeholder="Product search"
          onChange={(event) => setProductSearch(event.target.value)}
        />
        <Input
          value={commentSearch}
          placeholder="Comment search"
          onChange={(event) => setCommentSearch(event.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-200 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <PackageCheck className="h-5 w-5 text-cyan-700" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">Order Fulfillment</h4>
            <p className="text-sm text-slate-600">
              This page shows issue items returned from fulfillment and uses the same item columns
              as the fulfillment page.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-cyan-50/70">
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Warehouse</TableHead>
                <TableHead className="text-center">Order Qty</TableHead>
                <TableHead className="text-center">Delivered Qty</TableHead>
                <TableHead className="text-center">Remaining Qty</TableHead>
                <TableHead className="text-center">Available Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="min-w-[180px]">Comment</TableHead>
                <TableHead className="w-16 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    Loading issue items...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-rose-600">
                    Unable to load back-to-manager items.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    No issue items found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => {
                  const availableStockLabel =
                    typeof row.item.variantId === 'number'
                      ? 'Warehouse main stock'
                      : 'Product main stock';

                  return (
                    <TableRow key={row.item.orderDetailId}>
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
                      <TableCell className="align-top text-sm text-slate-700">
                        {row.item.itemComment?.trim() ? row.item.itemComment : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <TableRowActions
                          row={row.sourceItem}
                          actions={[
                            {
                              id: 'approve',
                              label: isPending ? 'Approving...' : 'Approve',
                              onClick: (selectedItem) => {
                                if (selectedItem) {
                                  void approveItem(selectedItem);
                                }
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <RotateCcw className="h-4 w-4" />
        {rows.length} issue item{rows.length === 1 ? '' : 's'}
      </div>
    </div>
  );
}
