'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCountOrderHistories, useGetAllOrderHistories } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { useGetAllPurchaseOrders as useGetAllOrders } from '@/core/api/purchase-order';
import { mapOrderHistoryEntries } from '../data/purchase-order-data';

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

export function OrderHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const apiPage = Math.max(currentPage - 1, 0);

  const { data: historyData, isLoading, isError } = useGetAllOrderHistories(
    {
      page: apiPage,
      size: pageSize,
      sort: ['createdDate,desc'],
    },
    {
      query: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const { data: countData } = useCountOrderHistories(undefined, {
    query: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  });

  const orderIds = useMemo(() => {
    const ids = (historyData ?? [])
      .map((entry) => entry.orderId ?? 0)
      .filter((id) => id > 0);
    return Array.from(new Set(ids));
  }, [historyData]);

  const { data: ordersData } = useGetAllOrders(
    orderIds.length
      ? {
        'id.in': orderIds,
        page: 0,
        size: orderIds.length,
      }
      : undefined,
    {
      query: {
        enabled: orderIds.length > 0,
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

  const totalCount = countData ?? historyData?.length ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);
  const paginatedRows = rows;

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Complete Purchase Order History</h3>
            <p className="text-sm text-muted-foreground">
              Timeline of every status change across all purchase orders and items
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="bg-slate-600 text-white hover:bg-slate-700">
          <Link href="/purchase-orders">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to purchase orders
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center">
            <svg className="h-12 w-12 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading history...</p>
          <p className="text-xs text-muted-foreground">Please wait while we fetch all records</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-1 font-semibold text-red-700">Unable to load purchase order history</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-200 bg-slate-50">
                <TableHead className="font-bold text-slate-700">Order</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Item Status</TableHead>
                <TableHead className="font-bold text-slate-700">Notification</TableHead>
                <TableHead className="font-bold text-slate-700">Created</TableHead>
                <TableHead className="font-bold text-slate-700">Updated</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((entry, index) => (
                <TableRow key={entry.orderHistoryId} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {startIndex + index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">#{entry.orderId}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.orderEmail || '—'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="border-2 border-blue-300 bg-blue-50 font-semibold text-blue-900"
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.itemStatus ? (
                      <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-900">
                        {entry.itemStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.notificationSent ? (
                      <Badge className="bg-emerald-100 font-semibold text-emerald-900">
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Sent
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-semibold text-slate-700">{formatDateTime(entry.createdDate)}</div>
                    <div className="text-xs text-muted-foreground">By {entry.createdBy}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-semibold text-slate-700">{formatDateTime(entry.lastUpdated || entry.createdDate)}</div>
                    <div className="text-xs text-muted-foreground">{entry.updatedBy ? `By ${entry.updatedBy}` : '—'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" className="bg-slate-600 text-white hover:bg-slate-700">
                      <Link href={`/purchase-orders/${entry.orderId}`}>
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {paginatedRows.length === 0 && totalCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="mb-1 font-semibold text-slate-700">No history entries yet</p>
                      <p className="text-sm text-muted-foreground">Purchase order activity will appear here once purchase orders are created</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !isError && totalCount > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm font-semibold text-slate-700">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-md border-2 border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              Showing {startIndex} to {endIndex} of {totalCount} entries
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              size="sm"
              className="bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              First
            </Button>
            <Button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              size="sm"
              className="bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <span className="px-3 text-sm font-semibold text-slate-700">
              {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={totalPages === 0 || currentPage === totalPages}
              size="sm"
              className="bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={totalPages === 0 || currentPage === totalPages}
              size="sm"
              className="bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
