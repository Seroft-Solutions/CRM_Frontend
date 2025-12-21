'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

type RowStatus =
  | 'SUCCESS'
  | 'DUPLICATE'
  | 'VALIDATION_FAILED'
  | 'SYSTEM_ERROR';

interface ImportSummary {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  validationErrorCount: number;
  systemErrorCount: number;
}

interface RowResult {
  rowNumber?: number;
  data?: string[];
  rowData?: string[];
  status?: RowStatus;
  message?: string;
}

interface ImportResponse {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  validationErrorCount: number;
  systemErrorCount: number;
  rows?: RowResult[];
  rowResults?: RowResult[];
}

export default function ImportResultsPage() {
  const router = useRouter();
  const [responseData, setResponseData] = useState<ImportResponse | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('productImportResponse');

    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setResponseData(data);
        sessionStorage.removeItem('productImportResponse');
      } catch (error) {
        console.error('Failed to parse import response data:', error);
      }
    }
  }, [router]);

  const tableRows = useMemo(() => {
    if (!responseData) return [];

    const rows = responseData.rows ?? responseData.rowResults ?? [];

    return rows.map((row, index) => ({
      rowNumber: row.rowNumber ?? index + 1,
      values: row.data ?? row.rowData ?? [],
      status: row.status ?? 'SYSTEM_ERROR',
      reason: row.message ?? '',
    }));
  }, [responseData]);

  const handleDownloadReport = () => {
    if (!responseData) return;

    const headers = [
      'Row #',
      'Product Category',
      'Product Sub Category',
      'Product Name',
      'Product code',
      'Article Number',
      'Description',
      'Total Quantity',
      'Base Price',
      'Discounted Price',
      'Sale Price',
      'Size',
      'Color',
      'Material',
      'Style',
      'Variant Price',
      'Variant Stock',
      'Status',
      'Reason'
    ];

    const sheetRows = tableRows.map((row) => [
      row.rowNumber,
      ...Array(16).fill('').map((_, idx) => row.values[idx] ?? ''), // 16 columns for product data
      row.status,
      row.reason,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Import Results');
    XLSX.writeFile(workbook, 'product-import-results.xlsx');
  };

  const failedCount =
    (responseData?.validationErrorCount ?? 0) +
    (responseData?.systemErrorCount ?? 0);

  if (!responseData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle>Import History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  No recent import session found.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/products/import">Start New Import</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload a file to see detailed results for this session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Centered Header */}
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          {/* Left Section: Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
              <CheckCircle className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Import Results</h1>
              <p className="text-sm text-sidebar-foreground/80">Review your product bulk upload summary</p>
            </div>
          </div>

          {/* Center Section: Empty for balance */}
          <div className="flex-1"></div>

          {/* Right Section: Spacer for balance */}
          <div className="flex-1"></div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <CardTitle>Import Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review your bulk upload summary and download report.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button asChild>
              <Link href="/products/import">Import Another File</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryCard label="Total Rows" value={responseData.totalRows} />
            <SummaryCard
              label="Successful"
              value={responseData.successCount}
              tone="success"
            />
            <SummaryCard
              label="Duplicates"
              value={responseData.duplicateCount}
              tone="warning"
            />
            <SummaryCard label="Failed" value={failedCount} tone="error" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">
                {responseData.validationErrorCount}
              </p>
              <p>Validation issues</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">
                {responseData.systemErrorCount}
              </p>
              <p>System errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Products Table - TODO: Implement this component */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Products</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review products that failed to import for corrections.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed products table component will be implemented here.
          </p>
        </CardContent>
      </Card>
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
