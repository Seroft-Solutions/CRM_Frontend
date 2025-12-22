'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderRecord, OrderStatus, orderStatusOptions } from '../data/order-data';

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Processing: 'bg-blue-100 text-blue-700 border-blue-200',
  Shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  Unknown: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

interface OrderTableProps {
  orders: OrderRecord[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.orderId.toString().includes(normalizedSearch) ||
        order.email.toLowerCase().includes(normalizedSearch) ||
        order.phone.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Search by order id, email, or phone. Use the status pills to focus on a stage.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full sm:w-72"
          />
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus | 'All')}
          className="w-full"
        >
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="All" className="whitespace-nowrap">
              All
            </TabsTrigger>
            {orderStatusOptions.map((status) => (
              <TabsTrigger key={status} value={status} className="whitespace-nowrap">
                {status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-28">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.orderId} className="hover:bg-muted/40">
                <TableCell className="font-semibold text-slate-800">
                  #{order.orderId}
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(order.createdDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[order.orderStatus] ?? statusColors.Unknown}
                  >
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{formatCurrency(order.orderTotalAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      Base {formatCurrency(order.orderBaseAmount)} · Discount {formatCurrency(order.discountAmount)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-slate-700">
                    <div>{order.shippingMethod || 'Not set'}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.shippingAmount ? formatCurrency(order.shippingAmount) : 'Included'}
                    </div>
                    {order.shippingId ? (
                      <div className="text-xs text-blue-700"># {order.shippingId}</div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-slate-800">
                    <div>{order.email || '—'}</div>
                    <div className="text-xs text-muted-foreground">{order.phone || '—'}</div>
                    <div className="text-xs text-muted-foreground">Type: {order.userType}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="border border-border bg-slate-50 text-slate-700">
                    {order.paymentStatus}
                  </Badge>
                  {order.discountCode ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Code: {order.discountCode}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${order.orderId}`}>View</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/orders/${order.orderId}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No orders match your filters yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
