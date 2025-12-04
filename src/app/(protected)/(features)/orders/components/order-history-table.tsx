'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderHistoryEntry, OrderRecord } from '../data/mock-orders';

interface OrderHistoryTableProps {
  orders: OrderRecord[];
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const rows = useMemo(() => {
    const expanded: Array<OrderHistoryEntry & { order: OrderRecord }> = [];

    orders.forEach((order) => {
      order.history.forEach((entry) => {
        expanded.push({ ...entry, order });
      });
    });

    return expanded.sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  }, [orders]);

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Timeline of every status change across orders and items.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Item Status</TableHead>
              <TableHead>Notification</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry) => (
              <TableRow key={entry.orderHistoryId}>
                <TableCell className="font-semibold text-slate-800">
                  #{entry.order.orderId}
                  <div className="text-xs text-muted-foreground">{entry.order.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="border border-border bg-slate-50 text-slate-700">
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.itemStatus ? (
                    <Badge variant="outline" className="border-slate-200">
                      {entry.itemStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.notificationSent ? (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                      {entry.notificationSent}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{new Date(entry.createdDate).toLocaleString()}</div>
                  <div className="text-xs">By {entry.createdBy}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{new Date(entry.lastUpdated || entry.createdDate).toLocaleString()}</div>
                  <div className="text-xs">{entry.updatedBy ? `By ${entry.updatedBy}` : '—'}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/orders/${entry.order.orderId}`}>View order</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No history entries yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
