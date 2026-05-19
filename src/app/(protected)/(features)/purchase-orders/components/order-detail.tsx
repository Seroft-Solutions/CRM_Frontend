'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Barcode,
  History,
  PackageCheck,
  TrendingUp,
  Truck,
  CreditCard,
  User,
  Phone,
  Mail,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetPurchaseOrderFulfillmentGenerations } from '@/core/api/purchase-order-fulfillment-generations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetAllProductCatalogs } from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas';
import { useWarehousesQuery } from '@/app/(protected)/(features)/warehouses/actions/warehouse-hooks';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';
import type { OrderDetailItem, OrderRecord, OrderStatus } from '../data/purchase-order-data';

const statusTheme: Record<OrderStatus, { pill: string; dot: string }> = {
  Created: { pill: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', dot: 'bg-amber-500' },
  Approved: {
    pill: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  PartiallyApproved: {
    pill: 'bg-orange-500/10 text-orange-600 ring-orange-500/20',
    dot: 'bg-orange-500',
  },
  Recived: { pill: 'bg-teal-500/10 text-teal-600 ring-teal-500/20', dot: 'bg-teal-500' },
  Unpacked: { pill: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20', dot: 'bg-cyan-500' },
  Pending: { pill: 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20', dot: 'bg-yellow-500' },
  Cancel: { pill: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', dot: 'bg-rose-500' },
  Unknown: { pill: 'bg-slate-500/10 text-slate-600 ring-slate-500/20', dot: 'bg-slate-500' },
};

function formatShortDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return '—';

  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function normalizeHistoryStatus(status?: string) {
  if (!status) return '—';

  return status.trim().toLowerCase() === 'pending' ? 'Created' : status;
}

function getVariantAttributesFromCatalog(
  catalog: ProductCatalogDTO | undefined,
  variantId: number | undefined
) {
  if (typeof variantId !== 'number') return undefined;
  const variant = catalog?.variants?.find((e) => e.id === variantId);
  const attrs = variant?.selections
    ?.map((s) => {
      const label = s.attribute?.label ?? s.attribute?.name;
      const value = s.option?.label ?? s.rawValue;

      return label && value ? `${label}: ${value}` : value;
    })
    .filter((v): v is string => Boolean(v?.trim()));

  return attrs?.length ? attrs.join(', ') : undefined;
}

function getCatalogVariantDisplay(
  item: OrderDetailItem,
  catalog: ProductCatalogDTO | undefined,
  fallback: string
) {
  if (!item.productCatalogId || !item.variantId) {
    return {
      name: item.productName || catalog?.productCatalogName || item.sku || fallback,
      sku: item.sku,
      variantAttributes: item.variantAttributes,
    };
  }
  const cv = catalog?.variants?.find((v) => v.id === item.variantId);
  const pName = item.productName ?? catalog?.product?.name;
  const sku = item.sku ?? cv?.sku;
  const va = item.variantAttributes ?? getVariantAttributesFromCatalog(catalog, item.variantId);

  return {
    name: pName && sku ? `${pName} - ${sku}` : pName || sku || fallback,
    sku,
    variantAttributes: va,
  };
}

function Metric({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <div className="text-sm font-bold text-slate-800 truncate leading-tight mt-0.5">
          {value}
        </div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

interface OrderDetailProps {
  order: OrderRecord;
  headerSlot?: ReactNode;
}

export function OrderDetail({ order, headerSlot }: OrderDetailProps) {
  const { data: fulfillmentGenerations = [] } = useGetPurchaseOrderFulfillmentGenerations(
    order.orderId
  );
  const catalogIds = useMemo(
    () =>
      Array.from(
        new Set(
          order.items
            .map((i) => i.productCatalogId)
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
    const m = new Map<number, ProductCatalogDTO>();

    catalogs.forEach((c) => {
      if (typeof c.id === 'number') m.set(c.id, c);
    });

    return m;
  }, [catalogs]);
  const warehouseQueryParams = useMemo(
    () => ({ page: 0, size: 1000, sort: ['name,asc'], 'status.equals': 'ACTIVE' as const }),
    []
  );
  const { data: warehouseRows = [] } = useWarehousesQuery(warehouseQueryParams, { enabled: true });
  const warehouseNameById = useMemo(
    () =>
      new Map(
        (warehouseRows as IWarehouse[])
          .filter((w): w is IWarehouse & { id: number } => typeof w.id === 'number')
          .map((w) => [w.id, w.name])
      ),
    [warehouseRows]
  );
  const displayItems = useMemo(() => {
    const qMap = new Map<number, number>();

    order.items.forEach((i) => qMap.set(i.orderDetailId, Math.max(0, i.quantity)));
    fulfillmentGenerations.forEach((g) => {
      g.items?.forEach((i) => {
        if (!i.orderDetailId) return;
        const dq = Math.max(0, i.deliveredQuantity ?? i.requestedQuantity ?? 0);

        qMap.set(i.orderDetailId, (qMap.get(i.orderDetailId) ?? 0) + dq);
      });
    });

    return order.items.map((item) => {
      const oq = qMap.get(item.orderDetailId) ?? Math.max(0, item.quantity);

      return {
        ...item,
        originalOrderedQuantity: oq,
        displayTotal: Math.max(oq * item.itemPrice + item.itemTaxAmount, 0),
      };
    });
  }, [fulfillmentGenerations, order.items]);

  const taxRate = order.orderTaxRate ?? 0;
  const taxableAmount = displayItems.reduce((s, i) => s + i.displayTotal, 0);
  const taxAmount = (taxRate / 100) * taxableAmount;
  const total = Math.max(taxableAmount + order.shipping.shippingAmount + taxAmount, 0);
  const creditorName = order.sundryCreditor?.creditorName || order.email || '—';
  const creditorPhone = order.sundryCreditor?.mobile || order.phone || '—';
  const creditorEmail = order.sundryCreditor?.email || order.email || '—';
  const st = statusTheme[order.orderStatus] ?? statusTheme.Unknown;

  return (
    <div className="flex flex-col h-[calc(100vh-12px)] bg-slate-100 overflow-hidden border border-slate-300">
      {headerSlot}

      {/* ── Metric strip ── */}
      <div className="grid grid-cols-5 divide-x divide-slate-200 border-b border-slate-300 bg-white">
        <Metric
          icon={<TrendingUp className="h-4 w-4 text-white" />}
          label="Order Total"
          value={formatCurrency(total)}
          sub={`Base ${formatCurrency(taxableAmount)} + Tax ${formatCurrency(taxAmount)}`}
          accent="bg-sidebar-accent"
        />
        <Metric
          icon={<CreditCard className="h-4 w-4 text-white" />}
          label="Payment"
          value={order.paymentStatus}
          sub={`Shipping: ${formatCurrency(order.shipping.shippingAmount)}`}
          accent="bg-emerald-500"
        />
        <Metric
          icon={<Truck className="h-4 w-4 text-white" />}
          label="Shipping"
          value={order.shipping.shippingMethod || 'Pending'}
          sub={order.shipping.shippingId ? `ID: ${order.shipping.shippingId}` : 'No tracking yet'}
          accent="bg-sky-500"
        />
        <Metric
          icon={<User className="h-4 w-4 text-white" />}
          label="Creditor"
          value={creditorName}
          sub={creditorPhone !== '—' ? creditorPhone : creditorEmail}
          accent="bg-violet-500"
        />
        <div className="flex items-center justify-center px-3 py-2.5">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${st.pill}`}
          >
            <span className={`w-2 h-2 rounded-full ${st.dot} animate-pulse`} />
            <span className="text-xs font-bold">{order.orderStatus}</span>
          </div>
        </div>
      </div>

      {/* ── 2-column body: fills remaining height ── */}
      <div className="flex-1 grid grid-cols-[1fr_280px] min-h-0">
        {/* ── LEFT: Items table (fills all left space) ── */}
        <div className="flex flex-col border-r border-slate-300 min-h-0">
          {/* Items header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-300 bg-white">
            <Package className="h-3.5 w-3.5 text-sidebar-accent" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Items
            </span>
            <span className="text-[10px] font-bold text-sidebar-accent-foreground bg-sidebar-accent/10 px-1.5 py-0.5 rounded-full">
              {displayItems.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] gap-1 text-slate-500 hover:text-sidebar-accent-foreground"
              >
                <Link href={`/purchase-orders/${order.orderId}/fulfillment/history`}>
                  <History className="h-3 w-3" />
                  History
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-6 px-2 text-[10px] gap-1 bg-sidebar-accent hover:bg-sidebar-accent/90 text-white"
              >
                <Link href={`/purchase-orders/${order.orderId}/fulfillment`}>
                  <PackageCheck className="h-3 w-3" />
                  Fulfill
                </Link>
              </Button>
            </div>
          </div>

          {/* Items table — flex-1 fills space */}
          <div className="flex-1 overflow-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-300 bg-slate-50">
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 px-4 w-10">
                    #
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2">
                    Product
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2">
                    SKU
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2">
                    Variant
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2">
                    Warehouse
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 text-center w-12">
                    Qty
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 text-right">
                    Price
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 text-right">
                    Tax
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 text-right pr-4">
                    Total
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-2 text-right pr-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item, idx) => {
                  const isLegacy = Boolean(item.productCatalogId) && !item.variantId;
                  const catalog =
                    typeof item.productCatalogId === 'number'
                      ? catalogById.get(item.productCatalogId)
                      : undefined;
                  const disp = getCatalogVariantDisplay(item, catalog, `Item #${idx + 1}`);
                  const wh =
                    typeof item.warehouseId === 'number'
                      ? (warehouseNameById.get(item.warehouseId) ?? `WH-${item.warehouseId}`)
                      : '—';

                  return (
                    <TableRow
                      key={item.orderDetailId}
                      className="border-b border-slate-200 hover:bg-sidebar-accent/5 transition-colors"
                    >
                      <TableCell className="py-1.5 px-4">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[9px] font-bold text-white">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-[13px] font-semibold text-slate-800">
                        {disp.name}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] text-slate-500 font-mono">
                        {(!isLegacy && disp.sku) || '—'}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] text-slate-500">
                        {(!isLegacy && disp.variantAttributes) || '—'}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] text-slate-500">{wh}</TableCell>
                      <TableCell className="py-1.5 text-center">
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-slate-100 text-[12px] font-bold text-slate-700 px-1.5">
                          {item.originalOrderedQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right text-[12px] text-slate-600">
                        {formatCurrency(item.itemPrice)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right text-[12px] text-slate-400">
                        {formatCurrency(item.itemTaxAmount)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right pr-4 text-[13px] font-bold text-slate-800">
                        {formatCurrency(item.displayTotal)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right pr-4">
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                        >
                          <Barcode className="h-3 w-3" />
                          Print Barcode
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-6 text-center text-xs text-slate-400">
                      No items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Total bar — pinned at bottom of left column */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-300 bg-slate-900 text-white mt-auto">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''} · Base{' '}
              {formatCurrency(taxableAmount)}
              {taxRate > 0 && ` · Tax ${taxRate}%`}
              {order.shipping.shippingAmount > 0 &&
                ` · Ship ${formatCurrency(order.shipping.shippingAmount)}`}
            </span>
            <span className="text-base font-black">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Creditor → History → Addresses (stacked, fills height) ── */}
        <div className="flex flex-col bg-white min-h-0 overflow-hidden">
          {/* Creditor */}
          <div className="border-b border-slate-300 px-3 py-2.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Creditor Details
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-violet-400 shrink-0" />
                <span className="text-[12px] font-semibold text-slate-800 truncate">
                  {creditorName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-violet-400 shrink-0" />
                <span className="text-[11px] text-slate-600 truncate">{creditorPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-violet-400 shrink-0" />
                <span className="text-[11px] text-slate-600 truncate">{creditorEmail}</span>
              </div>
            </div>
          </div>

          {/* History — flex-1 fills middle */}
          <div className="flex-1 flex flex-col border-b border-slate-300">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                History
              </span>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full ml-auto">
                {order.history.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {order.history.map((entry, idx) => (
                <div
                  key={entry.orderHistoryId}
                  className="flex gap-2.5 px-3 py-2 border-b border-slate-200 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${idx === 0 ? 'bg-sidebar-accent' : 'bg-slate-300'}`}
                    >
                      {idx + 1}
                    </div>
                    {idx < order.history.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {normalizeHistoryStatus(entry.status)}
                      </span>
                      {entry.itemStatus && (
                        <span className="text-[9px] text-sidebar-accent-foreground bg-sidebar-accent/10 px-1 py-0.5 rounded">
                          {entry.itemStatus}
                        </span>
                      )}
                      {entry.notificationSent && (
                        <span className="text-[9px] text-emerald-600">Notified</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {entry.createdBy} · {formatShortDate(entry.createdDate)}
                    </div>
                  </div>
                </div>
              ))}
              {order.history.length === 0 && (
                <div className="px-3 py-4 text-center text-[11px] text-slate-400">No history</div>
              )}
            </div>
          </div>

          {/* Addresses — pinned at bottom of right sidebar */}
          <div className="px-3 py-2.5 border-b border-slate-300">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Addresses
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Truck className="h-3 w-3 text-sky-400" />
                  <span className="text-[10px] font-bold text-sky-600 uppercase">Ship To</span>
                  <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded ml-auto">
                    {order.shipping.shippingMethod || 'Pending'}
                  </span>
                </div>
                <CompactAddress {...order.address.shipTo} />
              </div>
              <div className="h-px bg-slate-200" />
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <CreditCard className="h-3 w-3 text-violet-400" />
                  <span className="text-[10px] font-bold text-violet-600 uppercase">Bill To</span>
                  {order.address.billToSameAsShip && (
                    <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded ml-auto">
                      Same as ship
                    </span>
                  )}
                </div>
                {order.address.billToSameAsShip ? (
                  <div className="text-[11px] text-slate-400 italic">Same as shipping address</div>
                ) : (
                  <CompactAddress {...order.address.billTo} />
                )}
              </div>
            </div>
          </div>

          {/* Audit footer */}
          <div className="px-3 py-1.5 border-t border-slate-300 bg-slate-50 text-[10px] text-slate-400 mt-auto">
            Created by {order.createdBy}
            {order.updatedBy ? ` · Updated by ${order.updatedBy}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactAddress(address: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  addrLine1?: string;
  addrLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}) {
  const name = [address.firstName, address.middleName, address.lastName].filter(Boolean).join(' ');
  const city = [address.city, address.state, address.zipcode].filter(Boolean).join(', ');

  return (
    <div className="space-y-0.5 text-[11px] text-slate-600">
      {name && <div className="font-semibold text-slate-700">{name}</div>}
      {address.addrLine1 && <div>{address.addrLine1}</div>}
      {address.addrLine2 && <div>{address.addrLine2}</div>}
      {city && <div>{city}</div>}
      {(address.phone || address.email) && (
        <div className="text-[10px] text-slate-400 mt-0.5">
          {address.phone}
          {address.phone && address.email ? ' · ' : ''}
          {address.email}
        </div>
      )}
    </div>
  );
}
