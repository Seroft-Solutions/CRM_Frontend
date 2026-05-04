'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetProductDamages } from '@/core/api/product-damages';

const formatCurrency = (value?: number) =>
  (value ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('en-IN');
};

const toDateTimeParam = (value: string, endOfDay = false) => {
  if (!value) return undefined;
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}Z`;
};

export function DamageTable() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productName, setProductName] = useState('');
  const [warehouseName, setWarehouseName] = useState('');

  const params = useMemo(
    () => ({
      page: 0,
      size: 100,
      sort: ['createdDate,desc'],
      productName: productName || undefined,
      warehouseName: warehouseName || undefined,
      dateFrom: toDateTimeParam(dateFrom),
      dateTo: toDateTimeParam(dateTo, true),
    }),
    [dateFrom, dateTo, productName, warehouseName]
  );

  const { data: damages = [], isLoading } = useGetProductDamages(params);

  const totalDamagedItems = damages.reduce((sum, damage) => sum + (damage.quantity ?? 0), 0);
  const totalDamagedValue = damages.reduce((sum, damage) => sum + (damage.totalValue ?? 0), 0);
  const topDamagedProducts = useMemo(() => {
    const totals = new Map<string, number>();
    damages.forEach((damage) => {
      const name = damage.productName || `Product ${damage.productId ?? 'Unknown'}`;
      totals.set(name, (totals.get(name) ?? 0) + (damage.quantity ?? 0));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [damages]);

  return (
    <div className="space-y-6">
      {/* Summary Cards - Styled to match consistent pattern */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total Damaged Items</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{totalDamagedItems}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total Damaged Value</div>
          <div className="mt-1 text-2xl font-semibold text-rose-700">
            {formatCurrency(totalDamagedValue)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Top Damaged Products</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {topDamagedProducts.length ? (
              topDamagedProducts.map(([name, quantity]) => (
                <Badge key={name} variant="secondary">
                  {name}: {quantity}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-500">No records</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters - Styled consistently */}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Input
          type="text"
          placeholder="Search Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Search Warehouse Name"
          value={warehouseName}
          onChange={(e) => setWarehouseName(e.target.value)}
        />
      </div>

      {/* Table - Matching Call Type table styling */}
      <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
        <div className="table-scroll overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {damages.map((damage) => (
                <TableRow key={damage.id}>
                  <TableCell>{formatDate(damage.createdDate)}</TableCell>
                  <TableCell>{damage.productName || `Product ${damage.productId ?? '—'}`}</TableCell>
                  <TableCell>{damage.variantSku || '—'}</TableCell>
                  <TableCell>
                    {damage.warehouseName || `Warehouse ${damage.warehouseId ?? '—'}`}
                  </TableCell>
                  <TableCell className="text-right">{damage.quantity ?? 0}</TableCell>
                  <TableCell className="text-right">{formatCurrency(damage.unitPrice)}</TableCell>
                  <TableCell className="text-right font-semibold text-rose-700">
                    {formatCurrency(damage.totalValue)}
                  </TableCell>
                  <TableCell>{damage.createdBy || 'System'}</TableCell>
                  <TableCell>{damage.remarks || '—'}</TableCell>
                </TableRow>
              ))}
              {!isLoading && damages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    No damage records found.
                  </TableCell>
                </TableRow>
              ) : null}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    Loading damage records...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
