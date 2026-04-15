'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LedgerEntryInfo, LedgerSummaryInfo } from '@/core/api/ledger-types';

const orderStatusOptions = ['Created', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const paymentStatusOptions = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;

const getLabelFromCode = (options: readonly string[], code?: number) => {
  if (typeof code !== 'number') {
    return 'Unknown';
  }

  return options[code] ?? 'Unknown';
};

const formatCurrency = (amount?: number) =>
  (amount ?? 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

const formatDateValue = (value?: string) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return format(parsed, 'dd MMM yyyy, hh:mm a');
};

interface LedgerViewProps {
  partyLabel: string;
  partyName?: string;
  email?: string;
  mobile?: string;
  summary?: LedgerSummaryInfo;
  entries?: LedgerEntryInfo[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
}

export function LedgerView({
  partyLabel,
  partyName,
  email,
  mobile,
  summary,
  entries,
  isLoading,
  isError,
  emptyMessage,
}: LedgerViewProps) {
  const rows = entries ?? [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading ledger...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
        Unable to load the ledger right now. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{partyLabel}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {partyName || 'Not available'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Mobile
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{mobile || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{email || '—'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Debit Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary?.totalDebit)}
          </CardContent>
        </Card>
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Credit Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary?.totalCredit)}
          </CardContent>
        </Card>
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Closing Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary?.closingBalance)}
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-slate-900">{summary?.totalEntries ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              Paid: {summary?.paidEntries ?? 0} | Pending: {summary?.pendingEntries ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry, index) => (
                <TableRow
                  key={`${entry.documentType || 'ledger'}-${entry.documentId || index}-${entry.entryDate || index}`}
                >
                  <TableCell>{formatDateValue(entry.entryDate)}</TableCell>
                  <TableCell>{entry.documentType || '—'}</TableCell>
                  <TableCell className="font-medium">{entry.referenceNo || '—'}</TableCell>
                  <TableCell>{getLabelFromCode(orderStatusOptions, entry.orderStatus)}</TableCell>
                  <TableCell>
                    {getLabelFromCode(paymentStatusOptions, entry.paymentStatus)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.debit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.credit)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.documentPath ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={entry.documentPath}>View</Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
