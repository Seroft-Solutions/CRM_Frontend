'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllOrderHistories } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { useGetAllOrders } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { mapOrderHistoryEntries } from '../data/order-data';

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

export function OrderHistoryTable() {
  const { data: historyData, isLoading, isError } = useGetAllOrderHistories(
    {
      page: 0,
      size: 200,
      sort: ['createdDate,desc'],
    },
    {
      query: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const { data: ordersData } = useGetAllOrders(
    {
      page: 0,
      size: 200,
    },
    {
      query: {
        enabled: Boolean(historyData?.length),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const orderEmailById = useMemo(() => {
    return new Map((ordersData ?? []).map((order) => [order.id ?? 0, order.email ?? '']));
  }, [ordersData]);

  const rows = useMemo(() => {
    const entries = mapOrderHistoryEntries(historyData);

    return entries.map((entry) => ({
      ...entry,
      orderEmail: orderEmailById.get(entry.orderId) ?? '',
    }));
  }, [historyData, orderEmailById]);

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

      {isLoading ? (
        <div className="p-6 text-center text-sm text-muted-foreground">Loading history...</div>
      ) : isError ? (
        <div className="p-6 text-center text-sm text-rose-700">
          Unable to load order history right now.
        </div>
      ) : (
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
                    #{entry.orderId}
                    <div className="text-xs text-muted-foreground">
                      {entry.orderEmail || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="border border-border bg-slate-50 text-slate-700"
                    >
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
                        Sent
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{formatDateTime(entry.createdDate)}</div>
                    <div className="text-xs">By {entry.createdBy}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{formatDateTime(entry.lastUpdated || entry.createdDate)}</div>
                    <div className="text-xs">{entry.updatedBy ? `By ${entry.updatedBy}` : '—'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${entry.orderId}`}>View order</Link>
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
      )}
    </div>
  );
}
