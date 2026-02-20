'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PurchaseOrderDTO as OrderDTO } from '@/core/api/purchase-order';
import { OrderRecord, OrderStatus } from '../data/purchase-order-data';

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
  Unknown: 'bg-slate-100 text-slate-800 border-slate-300',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

interface OrderDetailProps {
  order: OrderRecord;
}

export function OrderDetail({ order }: OrderDetailProps) {
  const taxRate = order.orderTaxRate ?? 0;
  const taxableAmount = order.orderBaseAmount;
  const taxAmount = (taxRate / 100) * taxableAmount;
  const sundryCreditorName = order.sundryCreditor?.creditorName || order.email || '—';
  const sundryCreditorPhone = order.sundryCreditor?.mobile || order.phone || '—';
  const sundryCreditorEmail = order.sundryCreditor?.email || order.email || '—';

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="overflow-hidden border-2 border-yellow-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-yellow-50 to-amber-50 pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                  <svg className="h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-bold">Order Value</span>
              </div>
              <Badge
                variant="outline"
                className={statusColors[order.orderStatus] ?? statusColors.Unknown}
              >
                {order.orderStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Base</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order.orderBaseAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Shipping</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(order.shipping.shippingAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Tax{taxRate ? ` (${taxRate.toFixed(2)}%)` : ''}
              </span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(taxAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-100 to-amber-100 px-3 py-2.5">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(order.orderTotalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-sky-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-bold">Sundry Creditor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Name</span>
              <span className="truncate font-semibold text-slate-800">{sundryCreditorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Phone</span>
              <span className="font-semibold text-slate-800">{sundryCreditorPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Email</span>
              <span className="truncate font-semibold text-slate-800">{sundryCreditorEmail}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-green-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <span className="font-bold">Fulfillment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Payment</span>
              <Badge variant="secondary" className="border border-emerald-300 bg-emerald-50 text-emerald-900">
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Shipping</span>
              <span className="font-semibold text-slate-800">{order.shipping.shippingMethod || 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tracking ID</span>
              <span className="font-semibold text-slate-800">{order.shipping.shippingId || '—'}</span>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Audit Trail</div>
              <div className="space-y-1 text-xs text-slate-700">
                <div>Created: {order.createdBy}</div>
                <div>Updated: {order.updatedBy || '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 border-cyan-200 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-cyan-50 to-teal-50">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="font-bold">Order Items</span>
            <Badge className="ml-auto bg-cyan-100 text-cyan-900">{order.items.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-cyan-100 bg-cyan-50/50">
                <TableHead className="font-bold text-slate-700">Item</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Quantity</TableHead>
                <TableHead className="font-bold text-slate-700">Price</TableHead>
                <TableHead className="font-bold text-slate-700">Tax</TableHead>
                <TableHead className="font-bold text-slate-700">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <TableRow key={item.orderDetailId} className="hover:bg-cyan-50/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-100 text-xs font-bold text-cyan-900">
                          {index + 1}
                        </div>
                        <div>
                          {item.productName ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                {item.productCatalogId ? (
                                  <Badge variant="secondary" className="text-xs">Catalog</Badge>
                                ) : null}
                                <div className="font-semibold text-slate-800">{item.productName}</div>
                              </div>
                              {item.sku && (
                                <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                              )}
                              {item.variantAttributes && (
                                <div className="text-xs text-blue-600">
                                  {item.variantAttributes.split(',').map((attr, i) => (
                                    <div key={i}>{attr.trim()}</div>
                                  ))}
                                </div>
                              )}
                              {item.itemComment && (
                                <div className="text-xs italic text-muted-foreground">{item.itemComment}</div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="font-semibold text-slate-800">
                                {item.productCatalogId ? 'Catalog item' : `Item #${index + 1}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.itemComment || 'No product selected'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                        {item.itemStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">{item.quantity}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{formatCurrency(item.itemPrice)}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{formatCurrency(item.itemTaxAmount)}</TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {formatCurrency(item.itemTotalAmount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
                        <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No items in this order</p>
                      <p className="text-xs text-muted-foreground">Items will appear here once added</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-2 border-slate-300 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold">Order History</span>
            <Badge className="ml-auto bg-slate-100 text-slate-900">{order.history.length} events</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {order.history.map((entry, index) => (
            <div
              key={entry.orderHistoryId}
              className="relative flex items-start gap-4 rounded-lg border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                {index < order.history.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800">{entry.status}</span>
                  {entry.itemStatus ? (
                    <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-xs text-cyan-900">
                      Item: {entry.itemStatus}
                    </Badge>
                  ) : null}
                  {entry.notificationSent ? (
                    <Badge className="bg-green-100 text-green-900">
                      <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Notified
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">{entry.createdBy}</span> · {formatDateTime(entry.createdDate)}
                  {entry.updatedBy && <span className="ml-2">· Updated by <span className="font-semibold">{entry.updatedBy}</span></span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated {formatDateTime(entry.lastUpdated || entry.createdDate)}
                </div>
              </div>
            </div>
          ))}
          {order.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700">No history recorded yet</p>
              <p className="text-sm text-muted-foreground">Activity will appear here as the order progresses</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-2 border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-emerald-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold">Shipping & Billing Addresses</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border-2 border-emerald-300/50 bg-white p-5 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="font-bold text-slate-800">Ship To</h3>
                </div>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900">
                  {order.shipping.shippingMethod || 'Pending'}
                </Badge>
              </div>
              <AddressBlock {...order.address.shipTo} />
            </div>
            <div className="rounded-xl border-2 border-emerald-300/50 bg-white p-5 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 className="font-bold text-slate-800">Bill To</h3>
                </div>
                {order.address.billToSameAsShip ? (
                  <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-900">
                    Same as shipping
                  </Badge>
                ) : null}
              </div>
              <AddressBlock {...order.address.billTo} />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">Address Metadata</div>
            <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
              <div><span className="font-semibold">Created:</span> {formatDateTime(order.address.createdDate)}</div>
              <div><span className="font-semibold">Updated:</span> {formatDateTime(order.address.lastUpdated)}</div>
              <div><span className="font-semibold">Updated By:</span> {order.address.updatedBy || '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressBlock(address: {
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
  const displayValue = (value?: string) => value || '—';

  return (
    <div className="space-y-1 text-sm">
      <div className="font-semibold text-slate-800">
        {[address.firstName, address.middleName, address.lastName].filter(Boolean).join(' ') ||
          '—'}
      </div>
      <div>{displayValue(address.addrLine1)}</div>
      {address.addrLine2 ? <div>{address.addrLine2}</div> : null}
      <div>
        {displayValue(address.city)}, {displayValue(address.state)} {displayValue(address.zipcode)}
      </div>
      <div>{displayValue(address.country)}</div>
      {address.phone ? <div className="text-muted-foreground">Phone: {address.phone}</div> : null}
      {address.email ? <div className="text-muted-foreground">Email: {address.email}</div> : null}
    </div>
  );
}
