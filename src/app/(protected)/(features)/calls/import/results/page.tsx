'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FailedCallsTable } from '../components/failed-calls-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useGetAllImportHistories } from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function ImportResultsPage() {
  const router = useRouter();
  const [responseData, setResponseData] = useState<ImportResponse | null>(null);
  const {
    data: importHistoryPreview,
    isLoading: isImportHistoryLoading,
    isError: isImportHistoryError,
    error: importHistoryError,
    refetch: refetchImportHistory,
  } = useGetAllImportHistories(
    {
      page: 0,
      size: 1,
      sort: ['id,desc'],
    },
    {
      query: {
        staleTime: 30 * 1000,
      },
    }
  );
  const hasBackendHistory = (importHistoryPreview?.length ?? 0) > 0;

  useEffect(() => {
    const storedData = sessionStorage.getItem('callImportResponse');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setResponseData(data);
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

  const renderImportHistorySection = () => {
    if (isImportHistoryLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Loading Import History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fetching the latest failed import rows from the backend.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (isImportHistoryError) {
      const errorMessage =
        importHistoryError instanceof Error
          ? importHistoryError.message
          : 'Unable to load import history data.';
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Failed to Fetch Import History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <Button onClick={() => refetchImportHistory()} size="sm" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!hasBackendHistory) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              No Failed Import Rows in History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We could not find any import history records. Start a new import or check back later
              for results.
            </p>
          </CardContent>
        </Card>
      );
    }

    return <FailedCallsTable />;
  };

  const tableRows = useMemo(() => {
    if (!responseData) return [];

    return responseData.rows.map((row) => ({
      rowNumber: row.rowNumber,
      values: row.data ?? [],
      status: row.status,
      reason: row.message,
    }));
  }, [responseData]);

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              No Session Summary Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We could not locate the latest summary in session storage. The table below still
              reflects the current import history stored in the backend.
            </p>
            <Button asChild variant="outline">
              <Link href="/calls/import">Start a New Import</Link>
            </Button>
          </CardContent>
        </Card>

        {renderImportHistorySection()}
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
            <SummaryCard label="Total Rows" value={responseData.summary.totalRows} />
            <SummaryCard
              label="Successful"
              value={responseData.summary.successCount}
              tone="success"
            />
            <SummaryCard
              label="Duplicates"
              value={responseData.summary.duplicateCount}
              tone="warning"
            />
            <SummaryCard label="Failed" value={responseData.summary.failedCount} tone="error" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">
                {responseData.summary.validationErrorCount}
              </p>
              <p>Validation issues</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">
                {responseData.summary.masterMissingCount}
              </p>
              <p>Missing master data</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">
                {responseData.summary.systemErrorCount}
              </p>
              <p>System errors</p>
            </div>
          </div>
          <div className="border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">Message</p>
            <p className="text-sm text-muted-foreground">{responseData.message}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row-by-row details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row #</TableHead>
                  {callImportConfig.columns.map((col) => (
                    <TableHead key={col.column}>{col.header}</TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell className="font-semibold">{row.rowNumber}</TableCell>
                    {callImportConfig.columns.map((col, idx) => (
                      <TableCell key={`${row.rowNumber}-${col.column}`}>
                        <span className="font-medium">{row.values[idx] || '—'}</span>
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge
                        variant={
                          row.status === 'SUCCESS'
                            ? 'default'
                            : row.status === 'DUPLICATE'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="uppercase tracking-wide text-[10px]"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.reason}</TableCell>
                  </TableRow>
                ))}
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={callImportConfig.columns.length + 2}
                      className="text-center py-6"
                    >
                      <p className="text-sm text-muted-foreground">
                        No row level detail available.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {renderImportHistorySection()}
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
