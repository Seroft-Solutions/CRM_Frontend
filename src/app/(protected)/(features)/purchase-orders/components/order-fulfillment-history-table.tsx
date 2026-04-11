'use client';

import Link from 'next/link';
import { Eye, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PurchaseOrderFulfillmentGenerationResponse } from '@/core/api/purchase-order-fulfillment-generations';
import type { OrderRecord } from '../data/purchase-order-data';
import {
  formatOrderDateTime,
  getFulfillmentRecordLabel,
  getSundryCreditorDisplayName,
} from './order-fulfillment-utils';

interface OrderFulfillmentHistoryTableProps {
  order: OrderRecord;
  generations: PurchaseOrderFulfillmentGenerationResponse[];
  showHeader?: boolean;
}

export function OrderFulfillmentHistoryTable({
  order,
  generations,
  showHeader = true,
}: OrderFulfillmentHistoryTableProps) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {showHeader ? (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                <PackageCheck className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Purchase Order Fulfillment History</h3>
                <p className="text-sm text-slate-500">
                  {getSundryCreditorDisplayName(order)} • Purchase Order #{order.orderId}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="gap-2 bg-cyan-700 text-white hover:bg-cyan-800">
              <Link href={`/purchase-orders/${order.orderId}/fulfillment`}>
                <PackageCheck className="h-4 w-4" />
                Back To Fulfillment
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Record</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Received</TableHead>
                <TableHead className="text-center">Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations.length > 0 ? (
                generations.map((generation) => (
                  <TableRow
                    key={generation.id ?? generation.generationNumber}
                    className="hover:bg-slate-50/80"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">
                          {getFulfillmentRecordLabel(order.orderId, {
                            invoiceId: generation.id,
                            generationNumber: generation.generationNumber,
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          Saved by {generation.createdBy || 'System'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {formatOrderDateTime(generation.createdDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                        {generation.items?.length ?? 0} lines
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-emerald-700">
                      {generation.totalGeneratedQuantity ?? 0}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-amber-700">
                      {generation.totalBacklogQuantity ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {generation.id ? (
                        <Button
                          asChild
                          size="sm"
                          className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                        >
                          <Link
                            href={`/purchase-orders/${order.orderId}/fulfillment/history/${generation.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">Unavailable</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-slate-900">
                        No fulfillment history found
                      </div>
                      <p className="text-sm text-slate-500">
                        Save a purchase fulfillment and it will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
