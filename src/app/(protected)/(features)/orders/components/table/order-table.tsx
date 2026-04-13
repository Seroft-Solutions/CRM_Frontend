'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Eye, Package, Pencil } from 'lucide-react';
import { useCreateOrderHistory } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { usePartialUpdateOrder } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { type OrderDTO } from '@/core/api/generated/spring/schemas';
import { useGetOrderFulfillmentGenerations } from '@/core/api/order-fulfillment-generations';
import { InlinePermissionGuard, useAccount, useUserAuthorities } from '@/core/auth';
import { OrderFulfillmentHistoryTable } from '../order-fulfillment-history-table';
import {
  getOrderStatusCode,
  getOrderStatusTransitionError,
  getSelectableOrderStatuses,
  OrderStatus,
  orderStatusOptions,
  PaymentStatus,
  paymentStatusOptions,
  ShippingMethod,
  shippingMethodOptions,
} from '../../data/order-data';
import { useOrderRecord, useOrderTableData } from '../../hooks';

const statusColors: Record<OrderStatus, string> = {
  Created: 'bg-amber-100 text-amber-800 border-amber-300',
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

function formatDate(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getOrderStatusErrorDescription(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeAxiosError = error as {
      response?: {
        data?: {
          detail?: string;
          title?: string;
          message?: string;
        };
      };
    };

    return (
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.message ||
      fallback
    );
  }

  return fallback;
}

function getOrderStatusFromCode(code?: number): string {
  const statusMap: Record<number, string> = {
    0: 'Created',
    1: 'Processing',
    2: 'Shipped',
    3: 'Delivered',
    4: 'Cancelled',
  };
  return code !== undefined ? statusMap[code] || 'Unknown' : '—';
}

type EntityStatus = 'ACTIVE' | 'DRAFT';
type SortDirection = 'asc' | 'desc';
type SortColumn =
  | 'orderId'
  | 'status'
  | 'total'
  | 'shipping'
  | 'customer'
  | 'payment'
  | 'createdDate'
  | 'updatedDate';

function compareSortValues(
  a: string | number,
  b: string | number,
  direction: SortDirection
) {
  const multiplier = direction === 'asc' ? 1 : -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  return (
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    }) * multiplier
  );
}

type OrderTableProps = {
  entityStatus?: EntityStatus;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  allTabLabel?: string;
  showStatusTabs?: boolean;
  dateFrom?: string;
  dateTo?: string;
};

export function OrderTable({
  entityStatus = 'ACTIVE',
  title = 'All Orders',
  subtitle = 'order',
  searchPlaceholder = 'Search orders...',
  allTabLabel = 'All Orders',
  showStatusTabs = true,
  dateFrom = '',
  dateTo = '',
}: OrderTableProps) {
  const queryClient = useQueryClient();
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusOverrides, setStatusOverrides] = useState<Record<number, OrderStatus>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const { mutateAsync: partialUpdateOrder } = usePartialUpdateOrder();
  const { mutateAsync: createOrderHistory } = useCreateOrderHistory();
  const isMounted = useRef(false);

  // Filter states
  const [filters, setFilters] = useState<{
    orderId?: string;
    status?: string;
    total?: string;
    shipping?: string;
    customer?: string;
    email?: string;
    payment?: string;
    createdDateFrom?: string;
    updatedDateFrom?: string;
  }>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v && v.length > 0) || searchTerm.length > 0;

  const { orders, orderDtos, totalCount, totalPages, isLoading, isError } = useOrderTableData({
    entityStatus,
    statusFilter,
    searchTerm,
    currentPage,
    pageSize,
    createdBy: isBusinessPartner ? accountData?.login : undefined,
  });
  const orderDtoById = useMemo(
    () => new Map(orderDtos.map((order) => [order.id ?? 0, order] as const)),
    [orderDtos]
  );

  const resolveDiscountAmount = (order: (typeof orders)[number]) => {
    if (!order.discountCode) {
      return 0;
    }
    const shippingAmount = order.shipping.shippingAmount ?? 0;
    const taxRate = order.orderTaxRate ?? 0;
    const totalAmount = order.orderTotalAmount ?? 0;
    const divisor = 1 + taxRate / 100;

    if (divisor <= 0) return 0;
    const taxableAmount = Math.max((totalAmount - shippingAmount) / divisor, 0);

    return Math.max(order.orderBaseAmount - taxableAmount, 0);
  };

  // Apply client-side filters
  const filteredOrders = useMemo(() => {
    if (!orders) return orders;

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      if (normalizedSearchTerm) {
        const searchableValues = [
          String(order.orderId),
          `#${order.orderId}`,
          `ord/${order.orderId}`,
          `so-${order.orderId}`,
          `so/${order.orderId}`,
          `order ${order.orderId}`,
          `order #${order.orderId}`,
          order.customer?.customerBusinessName ?? '',
          order.email ?? '',
          order.phone ?? '',
          order.discountCode ?? '',
          order.shipping?.shippingId ?? '',
        ];

        const matchesSearch = searchableValues.some((value) =>
          String(value).toLowerCase().includes(normalizedSearchTerm)
        );

        if (!matchesSearch) {
          return false;
        }
      }

      // Order ID filter
      if (filters.orderId && !String(order.orderId).includes(filters.orderId)) {
        return false;
      }

      // Status filter
      if (filters.status) {
        const orderStatusStr = order.orderStatus || '';
        if (orderStatusStr.trim().toLowerCase() !== filters.status.trim().toLowerCase()) {
          return false;
        }
      }

      // Total filter
      if (filters.total) {
        const totalAmount = order.orderTotalAmount || 0;
        const filterValue = parseFloat(filters.total);
        if (!isNaN(filterValue) && totalAmount !== filterValue) {
          return false;
        }
      }

      // Payment filter
      if (filters.payment) {
        const paymentStatusStr = order.paymentStatus || '';
        if (paymentStatusStr.trim().toLowerCase() !== filters.payment.trim().toLowerCase()) {
          return false;
        }
      }

      // Shipping filter
      if (filters.shipping) {
        const shippingMethod = order.shipping?.shippingMethod || '';
        if (shippingMethod.trim().toLowerCase() !== filters.shipping.trim().toLowerCase()) {
          return false;
        }
      }

      // Customer filter
      if (filters.customer) {
        const customerName = order.customer?.customerBusinessName || '';
        if (!customerName.toLowerCase().includes(filters.customer.toLowerCase())) {
          return false;
        }
      }

      // Email filter
      if (filters.email && order.email) {
        if (!order.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false;
        }
      }

      // Created Date filter - match exact date
      if (filters.createdDateFrom && order.createdDate) {
        const orderDate = new Date(order.createdDate);
        const filterDate = new Date(filters.createdDateFrom);
        const orderDateStr = orderDate.toISOString().split('T')[0];
        if (orderDateStr !== filters.createdDateFrom) {
          return false;
        }
      }

      // Updated Date filter - match exact date
      if (filters.updatedDateFrom && order.lastModifiedDate) {
        const orderDate = new Date(order.lastModifiedDate);
        const orderDateStr = orderDate.toISOString().split('T')[0];
        if (orderDateStr !== filters.updatedDateFrom) {
          return false;
        }
      }

      // Date range filter (From - To)
      if ((dateFrom || dateTo) && order.createdDate) {
        const orderDate = new Date(order.createdDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0);
          if (orderDate < fromDate) {
            return false;
          }
        }
        
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [orders, filters, dateFrom, dateTo, searchTerm]);

  const sortedOrders = useMemo(() => {
    if (!sortColumn) {
      return filteredOrders;
    }

    return [...filteredOrders].sort((a, b) => {
      switch (sortColumn) {
        case 'orderId':
          return compareSortValues(a.orderId, b.orderId, sortDirection);
        case 'status':
          return compareSortValues(
            statusOverrides[a.orderId] ?? a.orderStatus ?? '',
            statusOverrides[b.orderId] ?? b.orderStatus ?? '',
            sortDirection
          );
        case 'total':
          return compareSortValues(a.orderTotalAmount ?? 0, b.orderTotalAmount ?? 0, sortDirection);
        case 'shipping':
          return compareSortValues(
            a.shipping?.shippingMethod ?? '',
            b.shipping?.shippingMethod ?? '',
            sortDirection
          );
        case 'customer':
          return compareSortValues(
            a.customer?.customerBusinessName ?? a.email ?? a.phone ?? '',
            b.customer?.customerBusinessName ?? b.email ?? b.phone ?? '',
            sortDirection
          );
        case 'payment':
          return compareSortValues(a.paymentStatus ?? '', b.paymentStatus ?? '', sortDirection);
        case 'createdDate':
          return compareSortValues(
            a.createdDate ? new Date(a.createdDate).getTime() : 0,
            b.createdDate ? new Date(b.createdDate).getTime() : 0,
            sortDirection
          );
        case 'updatedDate':
          return compareSortValues(
            a.lastModifiedDate ? new Date(a.lastModifiedDate).getTime() : 0,
            b.lastModifiedDate ? new Date(b.lastModifiedDate).getTime() : 0,
            sortDirection
          );
        default:
          return 0;
      }
    });
  }, [filteredOrders, sortColumn, sortDirection, statusOverrides]);

  const filteredCount = sortedOrders.length;
  const filteredTotalPages = Math.ceil(filteredCount / pageSize) || 1;
  const startIndex = filteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = filteredCount === 0 ? 0 : Math.min(currentPage * pageSize, filteredCount);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedOrders.slice(start, end);
  }, [sortedOrders, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleStatusFilterChange = (newFilter: OrderStatus | 'All') => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (column: SortColumn) => {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-slate-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-slate-600" />
    );
  };

  const toggleOrderHistory = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    if (filteredTotalPages === 1 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (filteredTotalPages > 1 && currentPage > filteredTotalPages) {
      setCurrentPage(filteredTotalPages);
    }
  }, [currentPage, filteredTotalPages]);

  useEffect(() => {
    if (!isMounted.current) return;
    setCurrentPage(1);
  }, [dateFrom, dateTo]);

  const handleOrderStatusChange = async (
    order: (typeof orders)[number],
    nextStatus: OrderStatus
  ) => {
    if (order.orderId <= 0) {
      return;
    }

    const currentStatus = statusOverrides[order.orderId] ?? order.orderStatus;

    if (currentStatus === nextStatus) {
      return;
    }

    const transitionError = getOrderStatusTransitionError(currentStatus, nextStatus, {
      isEditing: true,
    });

    if (transitionError) {
      toast.error('Invalid status change.', {
        description: transitionError,
      });

      return;
    }

    const hasOrderDto = orderDtoById.has(order.orderId);

    if (!hasOrderDto) {
      toast.error('Unable to update order status.', {
        description: 'Order data is incomplete. Refresh and try again.',
      });

      return;
    }

    const nextStatusCode = getOrderStatusCode(nextStatus);

    if (typeof nextStatusCode !== 'number') {
      toast.error('Unable to update order status.', {
        description: 'Selected status is not supported.',
      });

      return;
    }

    setStatusOverrides((prev) => ({
      ...prev,
      [order.orderId]: nextStatus,
    }));
    setUpdatingOrderId(order.orderId);

    try {
      await partialUpdateOrder({
        id: order.orderId,
        data: {
          id: order.orderId,
          orderStatus: nextStatusCode,
        } satisfies OrderDTO,
      });

      try {
        await createOrderHistory({
          data: {
            orderId: order.orderId,
            status: `Status changed to ${nextStatus}`,
            notificationSent: false,
          },
        });
      } catch (historyError) {
        console.error('Failed to create order history after status update:', historyError);
        toast.warning('Order status updated, but history entry could not be created.');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.orderId}`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/order-histories'] }),
      ]);

      toast.success('Order status updated.', {
        description: `Order #${order.orderId} is now ${nextStatus}.`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      setStatusOverrides((prev) => ({
        ...prev,
        [order.orderId]: currentStatus,
      }));
      toast.error('Unable to update order status.', {
        description: getOrderStatusErrorDescription(
          error,
          `Order #${order.orderId} could not be updated.`
        ),
      });
    } finally {
      setUpdatingOrderId((currentId) => (currentId === order.orderId ? null : currentId));
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading {subtitle}s...
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
      {showStatusTabs ? (
        <div className="border-b-2 border-slate-200 bg-slate-50/50 px-6 py-3">
          <Tabs
            value={statusFilter}
            onValueChange={(value) => handleStatusFilterChange(value as OrderStatus | 'All')}
            className="w-full"
          >
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
              <TabsTrigger
                value="All"
                className="whitespace-nowrap rounded-lg border-2 border-transparent bg-white data-[state=active]:border-slate-600 data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                {allTabLabel}
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
      ) : null}

      <div className="flex flex-col gap-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-muted-foreground">
              Search by order number, customer, email, or phone · {totalCount}{' '}
              {totalCount === 1 ? subtitle : `${subtitle}s`}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full border-slate-300 pl-9 sm:w-72"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => handleSearchChange('')}
            className="border-slate-300"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear
          </Button>
        </div>
      </div>

      <div className="table-container overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Header Row */}
            <TableRow className="border-b-2 border-slate-200 bg-slate-50">
              <TableHead className="w-32 min-w-[128px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('orderId')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Order</span>
                  {getSortIcon('orderId')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[150px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[120px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('total')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Total</span>
                  {getSortIcon('total')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[140px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('shipping')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Shipping</span>
                  {getSortIcon('shipping')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[150px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('customer')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Customer</span>
                  {getSortIcon('customer')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[120px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('payment')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Payment</span>
                  {getSortIcon('payment')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[150px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('createdDate')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Created At</span>
                  {getSortIcon('createdDate')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[150px] font-bold text-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('updatedDate')}
                  className="h-auto px-2 py-1 font-bold text-slate-700 hover:bg-white"
                >
                  <span>Updated At</span>
                  {getSortIcon('updatedDate')}
                </Button>
              </TableHead>
              <TableHead className="w-[150px] text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
            {/* Filter Row */}
            <TableRow className="border-b border-slate-200 bg-white">
              <TableHead className="py-2">
                <Input
                  placeholder="Filter..."
                  className="h-8 text-xs border-slate-300 w-full"
                  value={filters.orderId || ''}
                  onChange={(e) => handleFilterChange('orderId', e.target.value)}
                />
              </TableHead>
              <TableHead className="py-2">
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-300 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {orderStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="py-2">
                <Input
                  placeholder="Filter..."
                  className="h-8 text-xs border-slate-300 w-full"
                  value={filters.total || ''}
                  onChange={(e) => handleFilterChange('total', e.target.value)}
                />
              </TableHead>
              <TableHead className="py-2">
                <Select 
                  value={filters.shipping || 'all'} 
                  onValueChange={(value) => handleFilterChange('shipping', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-300 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {shippingMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="py-2">
                <Input
                  placeholder="Filter..."
                  className="h-8 text-xs border-slate-300 w-full"
                  value={filters.customer || ''}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                />
              </TableHead>
              <TableHead className="py-2">
                <Select 
                  value={filters.payment || 'all'} 
                  onValueChange={(value) => handleFilterChange('payment', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-300 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {paymentStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="py-2">
                <Input
                  type="date"
                  className="h-8 text-xs border-slate-300 w-full"
                  value={filters.createdDateFrom || ''}
                  onChange={(e) => handleFilterChange('createdDateFrom', e.target.value)}
                />
              </TableHead>
              <TableHead className="py-2">
                <Input
                  type="date"
                  className="h-8 text-xs border-slate-300 w-full"
                  value={filters.updatedDateFrom || ''}
                  onChange={(e) => handleFilterChange('updatedDateFrom', e.target.value)}
                />
              </TableHead>
              <TableHead className="py-2 text-right">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order, index) => {
              const customerName = order.customer?.customerBusinessName || order.email || '—';
              const customerContact = order.customer?.mobile || order.phone || '—';
              const displayedStatus = statusOverrides[order.orderId] ?? order.orderStatus;
              const isUpdatingThisRow = updatingOrderId === order.orderId;
              const statusClassName = statusColors[displayedStatus] ?? statusColors.Unknown;

              const isExpanded = expandedOrderId === order.orderId;

              return (
                <Fragment key={order.orderId}>
                  <TableRow className="transition-colors hover:bg-slate-50/70">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {startIndex + index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-800">#{order.orderId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleOrderHistory(order.orderId)}
                              title="Toggle fulfillment history"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(order.createdDate)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InlinePermissionGuard
                        requiredPermission="order:update"
                        fallback={
                          <Badge
                            variant="outline"
                            className={`border-2 font-semibold ${statusClassName}`}
                          >
                            {displayedStatus}
                          </Badge>
                        }
                      >
                        <Select
                          value={displayedStatus === 'Unknown' ? undefined : displayedStatus}
                          onValueChange={(value) =>
                            handleOrderStatusChange(order, value as OrderStatus)
                          }
                          disabled={isUpdatingThisRow}
                        >
                          <SelectTrigger
                            className={`h-9 min-w-[150px] border-2 font-semibold ${statusClassName}`}
                            aria-label={`Update status for order ${order.orderId}`}
                          >
                            <SelectValue placeholder={displayedStatus} />
                          </SelectTrigger>
                          <SelectContent>
                            {getSelectableOrderStatuses(displayedStatus, { isEditing: true }).map(
                              (status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </InlinePermissionGuard>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(order.orderTotalAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base {formatCurrency(order.orderBaseAmount)}
                        </div>
                        {resolveDiscountAmount(order) > 0 && (
                          <div className="text-xs font-semibold text-red-600">
                            -{formatCurrency(resolveDiscountAmount(order))}
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
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 text-xs text-emerald-900"
                          >
                            #{order.shipping.shippingId}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800">{customerName}</div>
                        <div className="text-xs text-muted-foreground">{customerContact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="border-2 border-emerald-300 bg-emerald-50 font-semibold text-emerald-900">
                          {order.paymentStatus}
                        </Badge>
                        {order.discountCode ? (
                          <div className="mt-1 text-xs font-semibold text-amber-700">
                            {order.discountCode}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">
                        {formatDate(order.createdDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">
                        {formatDate(order.lastModifiedDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={0}>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/orders/${order.orderId}`}
                                aria-label={`View order ${order.orderId}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/orders/${order.orderId}/fulfillment?from=list`}
                                aria-label={`Open fulfillment for order ${order.orderId}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Package className="h-4 w-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Fulfillment</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/orders/${order.orderId}/edit`}
                                aria-label={`Edit order ${order.orderId}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>

                  {isExpanded && <OrderFulfillmentHistoryRow order={order} />}
                </Fragment>
              );
            })}

            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <svg
                        className="h-8 w-8 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p className="mb-1 font-semibold text-slate-700">No orders found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? 'Try adjusting your search or filters'
                        : 'Orders will appear here once created'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {filteredCount > 0 && (
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
              <span className="font-bold text-slate-900">{filteredCount}</span> orders
              {filteredCount !== totalCount && (
                <span className="ml-1 text-muted-foreground">(filtered from {totalCount})</span>
              )}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-bold text-white">
                {currentPage}
              </span>
              <span className="text-sm text-slate-600">of</span>
              <span className="text-sm font-bold text-slate-900">{filteredTotalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(filteredTotalPages, prev + 1))}
              disabled={filteredTotalPages === 0 || currentPage === filteredTotalPages}
              className="border-slate-300 disabled:opacity-50"
            >
              Next
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(filteredTotalPages)}
              disabled={filteredTotalPages === 0 || currentPage === filteredTotalPages}
              className="border-slate-300 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderFulfillmentHistoryRowProps {
  order: Parameters<typeof OrderFulfillmentHistoryTable>[0]['order'];
}

function OrderFulfillmentHistoryRow({ order }: OrderFulfillmentHistoryRowProps) {
  const {
    data: generations = [],
    isLoading,
    isError,
  } = useGetOrderFulfillmentGenerations(order.orderId, {
    query: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  });
  const {
    orderRecord: detailedOrder,
    isLoading: isOrderLoading,
    isError: isOrderError,
  } = useOrderRecord(order.orderId, { includeHistory: false });
  const resolvedOrder = detailedOrder ?? order;

  return (
    <TableRow className="hover:bg-slate-50/50">
      <TableCell colSpan={9} className="p-0">
        <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
          {isLoading || isOrderLoading ? (
            <div className="text-sm text-muted-foreground">Loading fulfillment history...</div>
          ) : isError || isOrderError ? (
            <div className="text-sm text-red-600">
              Failed to load fulfillment history. Please try again.
            </div>
          ) : (
            <OrderFulfillmentHistoryTable
              order={resolvedOrder}
              generations={generations}
              showHeader={false}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
