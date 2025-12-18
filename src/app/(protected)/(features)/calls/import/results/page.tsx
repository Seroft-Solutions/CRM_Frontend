'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FailedCallsTable } from '../components/failed-calls-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { callImportConfig } from '../config';

type RowStatus =
  | 'SUCCESS'
  | 'DUPLICATE'
  | 'VALIDATION_FAILED'
  | 'MASTER_DATA_MISSING'
  | 'SYSTEM_ERROR';

interface ImportSummary {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  validationErrorCount: number;
  masterMissingCount: number;
  systemErrorCount: number;
}

interface RowResult {
  rowNumber: number;
  data: string[];
  status: RowStatus;
  message: string;
}

interface ImportResponse {
  success: boolean;
  summary: ImportSummary;
  rows: RowResult[];
  message: string;
}

const DEFAULT_SUMMARY: ImportSummary = {
  totalRows: 0,
  successCount: 0,
  duplicateCount: 0,
  failedCount: 0,
  validationErrorCount: 0,
  masterMissingCount: 0,
  systemErrorCount: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeRowStatus(value: unknown): RowStatus {
  switch (value) {
    case 'SUCCESS':
    case 'DUPLICATE':
    case 'VALIDATION_FAILED':
    case 'MASTER_DATA_MISSING':
    case 'SYSTEM_ERROR':
      return value;
    default:
      return 'SYSTEM_ERROR';
  }
}

function normalizeStoredImportResponse(value: unknown): ImportResponse | null {
  if (!isRecord(value)) return null;

  // Newer/expected shape: { success, summary: {...}, rows: [...], message }
  if (isRecord(value.summary)) {
    const summaryRecord = value.summary;
    const rowsValue = Array.isArray(value.rows) ? value.rows : [];

    return {
      success: typeof value.success === 'boolean' ? value.success : true,
      message: typeof value.message === 'string' ? value.message : 'Import completed.',
      summary: {
        totalRows: toNumber(summaryRecord.totalRows),
        successCount: toNumber(summaryRecord.successCount),
        duplicateCount: toNumber(summaryRecord.duplicateCount),
        failedCount: toNumber(summaryRecord.failedCount),
        validationErrorCount: toNumber(summaryRecord.validationErrorCount),
        masterMissingCount: toNumber(summaryRecord.masterMissingCount),
        systemErrorCount: toNumber(summaryRecord.systemErrorCount),
      },
      rows: rowsValue.map((row, index) => {
        const rowRecord = isRecord(row) ? row : {};
        return {
          rowNumber: toNumber(rowRecord.rowNumber) || index + 1,
          data: Array.isArray(rowRecord.data) ? (rowRecord.data as string[]) : [],
          status: normalizeRowStatus(rowRecord.status),
          message: typeof rowRecord.message === 'string' ? rowRecord.message : '',
        };
      }),
    };
  }

  // Current backend schema stored from progress polling: ImportResult (flat counts + rows)
  const rowsValue = Array.isArray(value.rows) ? value.rows : [];
  const summary: ImportSummary = {
    totalRows: toNumber(value.totalRows),
    successCount: toNumber(value.successCount),
    duplicateCount: toNumber(value.duplicateCount),
    failedCount: toNumber(value.failedCount),
    validationErrorCount: toNumber(value.validationErrorCount),
    masterMissingCount: toNumber(value.masterMissingCount),
    systemErrorCount: toNumber(value.systemErrorCount),
  };

  return {
    success: true,
    message: 'Import completed.',
    summary,
    rows: rowsValue.map((row, index) => {
      const rowRecord = isRecord(row) ? row : {};
      return {
        rowNumber: toNumber(rowRecord.rowNumber) || index + 1,
        data: Array.isArray(rowRecord.data) ? (rowRecord.data as string[]) : [],
        status: normalizeRowStatus(rowRecord.status),
        message: typeof rowRecord.message === 'string' ? rowRecord.message : '',
      };
    }),
  };
}

export default function ImportResultsPage() {
  const router = useRouter();
  const [responseData, setResponseData] = useState<ImportResponse | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('callImportResponse');

    if (storedData) {
      try {
        const data = JSON.parse(storedData) as unknown;
        const normalized = normalizeStoredImportResponse(data);

        if (!normalized) {
          throw new Error('Unexpected import result payload shape');
        }

        setResponseData(normalized);
        // Clear the data from session storage after reading it
        sessionStorage.removeItem('callImportResponse');
      } catch (error) {
        console.error('Failed to parse import response data:', error);
        router.push('/calls/import');
      }
    } else {
      // If no data, redirect back to import page
      // router.push('/calls/import');
    }
  }, [router]);

  const tableRows = useMemo(() => {
    if (!responseData) return [];

    return responseData.rows.map((row) => ({
      rowNumber: row.rowNumber,
      values: row.data ?? [],
      status: row.status,
      reason: row.message,
    }));
  }, [responseData]);

  const summary = responseData?.summary ?? DEFAULT_SUMMARY;

  const handleDownloadReport = () => {
    if (!responseData) return;

    const headers = ['Row #', ...callImportConfig.columns.map((c) => c.header), 'Status', 'Reason'];
    const sheetRows = tableRows.map((row) => [
      row.rowNumber,
      ...callImportConfig.columns.map((_, idx) => row.values[idx] ?? ''),
      row.status,
      row.reason,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Import Results');
    XLSX.writeFile(workbook, 'call-import-results.xlsx');
  };

  if (!responseData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle>Import Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload a file to see detailed results for this session.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/calls/import">Start New Import</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We could not find recent import session data in this browser. This can happen if the
              page is refreshed or opened in a new tab. The failed rows section below still shows
              the latest import history from the backend.
            </p>
          </CardContent>
        </Card>

        <FailedCallsTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <CardTitle>Import Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review your bulk upload summary and fix issues.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button asChild>
              <Link href="/calls/import">Import Another File</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryCard label="Total Rows" value={summary.totalRows} />
            <SummaryCard label="Successful" value={summary.successCount} tone="success" />
            <SummaryCard label="Duplicates" value={summary.duplicateCount} tone="warning" />
            <SummaryCard label="Failed" value={summary.failedCount} tone="error" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{summary.validationErrorCount}</p>
              <p>Validation issues</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{summary.masterMissingCount}</p>
              <p>Missing master data</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{summary.systemErrorCount}</p>
              <p>System errors</p>
            </div>
          </div>
          <div className="border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">Message</p>
            <p className="text-sm text-muted-foreground">{responseData.message}</p>
          </div>
        </CardContent>
      </Card>

      {/*<Card>*/}
      {/*  <CardHeader>*/}
      {/*    <CardTitle>Row-by-row details</CardTitle>*/}
      {/*  </CardHeader>*/}
      {/*  <CardContent className="p-0">*/}
      {/*    <div className="overflow-x-auto">*/}
      {/*      <Table>*/}
      {/*        <TableHeader>*/}
      {/*          <TableRow>*/}
      {/*            <TableHead className="w-16">Row #</TableHead>*/}
      {/*            {callImportConfig.columns.map((col) => (*/}
      {/*              <TableHead key={col.column}>{col.header}</TableHead>*/}
      {/*            ))}*/}
      {/*            <TableHead>Status</TableHead>*/}
      {/*            <TableHead>Reason</TableHead>*/}
      {/*          </TableRow>*/}
      {/*        </TableHeader>*/}
      {/*        <TableBody>*/}
      {/*          {tableRows.map((row) => (*/}
      {/*            <TableRow key={row.rowNumber}>*/}
      {/*              <TableCell className="font-semibold">{row.rowNumber}</TableCell>*/}
      {/*              {callImportConfig.columns.map((col, idx) => (*/}
      {/*                <TableCell key={`${row.rowNumber}-${col.column}`}>*/}
      {/*                  <span className="font-medium">{row.values[idx] || '—'}</span>*/}
      {/*                </TableCell>*/}
      {/*              ))}*/}
      {/*              <TableCell>*/}
      {/*                <Badge*/}
      {/*                  variant={*/}
      {/*                    row.status === 'SUCCESS'*/}
      {/*                      ? 'default'*/}
      {/*                      : row.status === 'DUPLICATE'*/}
      {/*                      ? 'secondary'*/}
      {/*                      : 'destructive'*/}
      {/*                  }*/}
      {/*                  className="uppercase tracking-wide text-[10px]"*/}
      {/*                >*/}
      {/*                  {row.status}*/}
      {/*                </Badge>*/}
      {/*              </TableCell>*/}
      {/*              <TableCell className="text-sm text-muted-foreground">{row.reason}</TableCell>*/}
      {/*            </TableRow>*/}
      {/*          ))}*/}
      {/*          {tableRows.length === 0 && (*/}
      {/*            <TableRow>*/}
      {/*              <TableCell colSpan={callImportConfig.columns.length + 2} className="text-center py-6">*/}
      {/*                <p className="text-sm text-muted-foreground">No row level detail available.</p>*/}
      {/*              </TableCell>*/}
      {/*            </TableRow>*/}
      {/*          )}*/}
      {/*        </TableBody>*/}
      {/*      </Table>*/}
      {/*    </div>*/}
      {/*  </CardContent>*/}
      {/*</Card>*/}

      <FailedCallsTable />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning' | 'error';
}) {
  const variant =
    tone === 'success'
      ? 'default'
      : tone === 'warning'
        ? 'secondary'
        : tone === 'error'
          ? 'destructive'
          : undefined;

  return (
    <div className="flex flex-col p-4 border rounded-lg">
      <span className="text-muted-foreground">{label}</span>
      {variant ? (
        <Badge variant={variant} className="mt-1 w-fit">
          {value}
        </Badge>
      ) : (
        <span className="font-semibold text-2xl">{value}</span>
      )}
    </div>
  );
}
