'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderRecord, OrderStatus } from '../data/mock-orders';

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Processing: 'bg-blue-100 text-blue-700 border-blue-200',
  Shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

interface OrderDetailProps {
  order: OrderRecord;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Order Value
              <Badge variant="outline" className={statusColors[order.orderStatus]}>
                {order.orderStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Base</span>
              <span className="font-semibold">{formatCurrency(order.orderBaseAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-700">
              <span>Discount</span>
              <span className="font-semibold">- {formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold">{formatCurrency(order.shippingAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-slate-800">
                {formatCurrency(order.orderTotalAmount)}
              </span>
            </div>
            {order.discountCode ? (
              <div className="text-xs text-muted-foreground">
                Discount code {order.discountCode} ({order.discountType || 'N/A'})
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Type</span>
              <span className="font-semibold">{order.userType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Phone</span>
              <span className="font-semibold">{order.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="font-semibold">{order.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Notification</span>
              <span className="font-semibold">{order.notificationType || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Busy Flag</span>
              <span className="font-semibold">{order.busyFlag ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Payment</span>
              <Badge variant="secondary" className="border border-border bg-slate-50 text-slate-700">
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold">{order.shippingMethod || 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping Id</span>
              <span className="font-semibold">{order.shippingId || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voucher</span>
              <span className="font-semibold">{order.busyVoucherId || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created By</span>
              <span className="font-semibold">{order.createdBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Updated By</span>
              <span className="font-semibold">{order.updatedBy || '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Discount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.orderDetailId}>
                  <TableCell className="font-semibold text-slate-800">
                    #{item.itemId}
                    <div className="text-xs text-muted-foreground">
                      {item.itemComment || 'No comment'}
                    </div>
                  </TableCell>
                  <TableCell>{item.itemStatus}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.itemPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.itemTaxAmount)}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(item.itemTotalAmount)}
                  </TableCell>
                  <TableCell>
                    {item.discountAmount ? (
                      <div className="space-y-1 text-sm">
                        <div>-{formatCurrency(item.discountAmount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.discountType} {item.discountCode ? `· ${item.discountCode}` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.history.map((entry) => (
            <div
              key={entry.orderHistoryId}
              className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3"
            >
              <div className="h-2 w-2 translate-y-2 rounded-full bg-slate-600" />
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{entry.status}</span>
                  {entry.itemStatus ? (
                    <Badge variant="outline" className="border-slate-300 bg-white text-xs">
                      Item: {entry.itemStatus}
                    </Badge>
                  ) : null}
                  {entry.notificationSent ? (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-800">
                      Notified via {entry.notificationSent}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm text-muted-foreground">
                  Created by {entry.createdBy} on {formatDateTime(entry.createdDate)}
                  {entry.updatedBy ? ` · Updated by ${entry.updatedBy}` : ''}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated {formatDateTime(entry.lastUpdated || entry.createdDate)}
                </div>
              </div>
            </div>
          ))}
          {order.history.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-muted-foreground">
              No history recorded yet.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Address Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Ship To</h3>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  {order.shippingMethod || 'Pending'}
                </Badge>
              </div>
              <AddressBlock {...order.address.shipTo} />
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Bill To</h3>
                {order.address.billToSameAsShip ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                    Same as shipping
                  </Badge>
                ) : null}
              </div>
              <AddressBlock {...order.address.billTo} />
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <div>Created: {formatDateTime(order.address.createdDate)}</div>
            <div>Updated: {formatDateTime(order.address.lastUpdated)}</div>
            <div>Updated By: {order.address.updatedBy || '—'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressBlock(address: {
  firstName: string;
  middleName?: string;
  lastName: string;
  addrLine1: string;
  addrLine2?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone?: string;
  email?: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="font-semibold text-slate-800">
        {[address.firstName, address.middleName, address.lastName].filter(Boolean).join(' ')}
      </div>
      <div>{address.addrLine1}</div>
      {address.addrLine2 ? <div>{address.addrLine2}</div> : null}
      <div>
        {address.city}, {address.state} {address.zipcode}
      </div>
      <div>{address.country}</div>
      {address.phone ? <div className="text-muted-foreground">Phone: {address.phone}</div> : null}
      {address.email ? <div className="text-muted-foreground">Email: {address.email}</div> : null}
    </div>
  );
}
