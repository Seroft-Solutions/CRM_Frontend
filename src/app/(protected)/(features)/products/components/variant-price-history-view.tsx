'use client';

import Link from 'next/link';
import { AlertTriangle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useProductVariantPriceHistoryQuery } from '../actions/product-price-history-hooks';

interface VariantPriceHistoryViewProps {
  productId: number;
}

const formatMoney = (value?: number | null) =>
  value === undefined || value === null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

export function VariantPriceHistoryView({ productId }: VariantPriceHistoryViewProps) {
  const { data: product } = useGetProduct(productId, {
    query: { enabled: Number.isFinite(productId) && productId > 0 },
  });
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useProductVariantPriceHistoryQuery(productId);

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="text-sm font-semibold text-red-700">
            Unable to load variant price history
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 text-sm text-red-700">
          <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Variant Price History</h2>
              <p className="text-[11px] text-muted-foreground">
                {product?.name
                  ? `${product.name} variant price changes`
                  : 'Tracked variant price changes'}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${productId}`}>Back To Product</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {history.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No variant price history found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Changed At</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Link ID</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                    <TableCell>{entry.changedBy || 'System'}</TableCell>
                    <TableCell>{entry.sku || '—'}</TableCell>
                    <TableCell>{entry.linkId || '—'}</TableCell>
                    <TableCell>
                      {formatMoney(entry.previousPrice)} {'->'} {formatMoney(entry.newPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
