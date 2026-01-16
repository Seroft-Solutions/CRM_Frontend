'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountOrders, useGetAllOrders } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import type { CountOrdersParams } from '@/core/api/generated/spring/schemas';
import { useGetAllOrderDiscountDetails } from '@/core/api/order-discount-detail';
import { useGetAllOrderShippingDetails } from '@/core/api/order-shipping-detail';
import {
  getOrderStatusCode,
  mapOrderDiscountDetail,
  mapOrderDtoToRecord,
  mapOrderShippingDetail,
  OrderStatus,
  orderStatusOptions,
} from '../data/order-data';

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
  Unknown: 'bg-slate-100 text-slate-800 border-slate-300',
};

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

export function OrderTable() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterParams = useMemo<CountOrdersParams>(() => {
    const params: CountOrdersParams = {};

    if (statusFilter !== 'All') {
      const statusCode = getOrderStatusCode(statusFilter);
      if (typeof statusCode === 'number') {
        params['orderStatus.equals'] = statusCode;
      }
    }

    const normalizedSearch = searchTerm.trim();
    if (normalizedSearch) {
      const numericOnly = /^\d+$/.test(normalizedSearch);
      const phoneLike = /^[+()\d\s-]+$/.test(normalizedSearch);

      if (numericOnly && normalizedSearch.length < 7) {
        params['id.equals'] = Number(normalizedSearch);
      } else if (normalizedSearch.includes('@')) {
        params['email.contains'] = normalizedSearch;
      } else if (phoneLike || numericOnly) {
        params['phone.contains'] = normalizedSearch;
      } else {
        params['email.contains'] = normalizedSearch;
      }
    }

    return params;
  }, [searchTerm, statusFilter]);

  const apiPage = Math.max(currentPage - 1, 0);

  const { data, isLoading, isError } = useGetAllOrders(
    {
      page: apiPage,
      size: pageSize,
      sort: ['id,desc'],
      ...filterParams,
    },
    {
      query: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const { data: countData } = useCountOrders(filterParams, {
    query: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  });

  const orders = useMemo(() => (data ?? []).map(mapOrderDtoToRecord), [data]);
  const orderIds = useMemo(
    () => orders.map((order) => order.orderId).filter((id) => id > 0),
    [orders]
  );
  const orderById = useMemo(
    () => new Map((data ?? []).map((order) => [order.id ?? 0, order])),
    [data]
  );

  const { data: shippingData } = useGetAllOrderShippingDetails(
    orderIds.length ? { 'orderId.in': orderIds } : undefined,
    {
      query: {
        enabled: orderIds.length > 0,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const { data: discountData } = useGetAllOrderDiscountDetails(
    orderIds.length ? { 'orderId.in': orderIds } : undefined,
    {
      query: {
        enabled: orderIds.length > 0,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    }
  );

  const shippingByOrderId = useMemo(() => {
    return new Map((shippingData ?? []).map((shipping) => [shipping.orderId ?? 0, shipping]));
  }, [shippingData]);

  const discountByOrderId = useMemo(() => {
    return new Map((discountData ?? []).map((discount) => [discount.orderId ?? 0, discount]));
  }, [discountData]);

  const ordersWithShipping = useMemo(() => {
    return orders.map((order) => {
      const shipping = shippingByOrderId.get(order.orderId);
      const orderDto = orderById.get(order.orderId);
      const discount = discountByOrderId.get(order.orderId);
      return {
        ...order,
        shipping: mapOrderShippingDetail(shipping, orderDto),
        discount: mapOrderDiscountDetail(discount, orderDto),
      };
    });
  }, [orders, orderById, shippingByOrderId, discountByOrderId]);

  const totalCount = countData ?? orders.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);
  const paginatedOrders = ordersWithShipping;

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: OrderStatus | 'All') => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading orders...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
        Unable to load orders right now. Please try again.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-lg">
      <div className="flex flex-col gap-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">All Orders</h3>
            <p className="text-sm text-muted-foreground">
              Search by ID, email, or phone · {totalCount} {totalCount === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full border-slate-300 pl-9 sm:w-72"
            />
          </div>
          <Button variant="outline" onClick={() => handleSearchChange('')} className="border-slate-300">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </Button>
        </div>
      </div>

      <div className="border-b-2 border-slate-200 bg-slate-50/50 px-6 py-3">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => handleFilterChange(value as OrderStatus | 'All')}
          className="w-full"
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            <TabsTrigger
              value="All"
              className="whitespace-nowrap rounded-lg border-2 border-transparent bg-white data-[state=active]:border-slate-600 data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              All Orders
            </TabsTrigger>
            {orderStatusOptions.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="whitespace-nowrap rounded-lg border-2 border-transparent bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                {status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-slate-200 bg-slate-50">
              <TableHead className="w-28 font-bold text-slate-700">Order</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="font-bold text-slate-700">Total</TableHead>
              <TableHead className="font-bold text-slate-700">Shipping</TableHead>
              <TableHead className="font-bold text-slate-700">Customer</TableHead>
              <TableHead className="font-bold text-slate-700">Payment</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order, index) => {
              const customerName = order.customer?.customerBusinessName || order.email || '—';
              const customerContact = order.customer?.mobile || order.phone || '—';

              return (
              <TableRow key={order.orderId} className="transition-colors hover:bg-slate-50/70">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {startIndex + index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">#{order.orderId}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdDate)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`border-2 font-semibold ${statusColors[order.orderStatus] ?? statusColors.Unknown}`}
                  >
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{formatCurrency(order.orderTotalAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      Base {formatCurrency(order.orderBaseAmount)}
                    </div>
                    {order.discount.discountAmount > 0 && (
                      <div className="text-xs font-semibold text-red-600">
                        -{formatCurrency(order.discount.discountAmount)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-700">
                      {order.shipping.shippingMethod || 'Not set'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.shipping.shippingAmount
                        ? formatCurrency(order.shipping.shippingAmount)
                        : 'Included'}
                    </div>
                    {order.shipping.shippingId ? (
                      <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-xs text-emerald-900">
                        #{order.shipping.shippingId}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-800">{customerName}</div>
                    <div className="text-xs text-muted-foreground">{customerContact}</div>
                    <Badge variant="outline" className="border-blue-300 bg-blue-50 text-xs text-blue-900">
                      {order.userType}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge className="border-2 border-emerald-300 bg-emerald-50 font-semibold text-emerald-900">
                      {order.paymentStatus}
                    </Badge>
                    {order.discount.discountCode ? (
                      <div className="mt-1 text-xs font-semibold text-amber-700">
                        {order.discount.discountCode}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="border-slate-300">
                      <Link href={`/orders/${order.orderId}`}>
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="bg-slate-600 text-white hover:bg-slate-700">
                      <Link href={`/orders/${order.orderId}/edit`}>
                        <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}

            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="mb-1 font-semibold text-slate-700">No orders found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search or filters' : 'Orders will appear here once created'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-md border-2 border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              Showing <span className="font-bold text-slate-900">{startIndex}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> orders
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="border-slate-300 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-slate-300 disabled:opacity-50"
            >
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-bold text-white">
                {currentPage}
              </span>
              <span className="text-sm text-slate-600">of</span>
              <span className="text-sm font-bold text-slate-900">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={totalPages === 0 || currentPage === totalPages}
              className="border-slate-300 disabled:opacity-50"
            >
              Next
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={totalPages === 0 || currentPage === totalPages}
              className="border-slate-300 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
