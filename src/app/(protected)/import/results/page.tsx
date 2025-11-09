'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { masterDataImportConfig } from '../constants';

type CellStatus = 'SUCCESS' | 'DUPLICATE' | 'FAILED_VALIDATION' | 'FAILED_DEPENDENCY' | 'SYSTEM_ERROR';

interface CellResult {
  column: string;
  masterType: string;
  value: string;
  status: CellStatus;
  message: string;
}

interface RowResult {
  rowNumber: number;
  cells: CellResult[];
}

interface ImportResponse {
  success: boolean;
  totalRows: number;
  totalItems: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: string[];
  rows: RowResult[];
  message: string;
}

type TableRowData = {
  rowNumber: number;
  cellsByColumn: Record<string, CellResult | undefined>;
  reason: string;
};

export default function MasterDataImportResultsPage() {
  const router = useRouter();
  const [responseData, setResponseData] = useState<ImportResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('masterImportResponse');
    if (stored) {
      try {
        setResponseData(JSON.parse(stored));
        sessionStorage.removeItem('masterImportResponse');
      } catch (error) {
        console.error('Failed to parse master import response:', error);
        router.push('/import');
      }
    }
  }, [router]);

  const tableRows: TableRowData[] = useMemo(() => {
    if (!responseData) {
      return [];
    }

    return responseData.rows.map((row) => {
      const cellsByColumn: Record<string, CellResult | undefined> = {};
      row.cells.forEach((cell) => {
        cellsByColumn[cell.column] = cell;
      });

      const reason = masterDataImportConfig.columns
        .map((col) => {
          const cell = cellsByColumn[col.column];
          if (!cell || cell.status === 'SUCCESS') {
            return null;
          }
          return `${col.header}: ${cell.message}`;
        })
        .filter(Boolean)
        .join(' | ');

      return {
        rowNumber: row.rowNumber,
        cellsByColumn,
        reason,
      };
    });
  }, [responseData]);

  const handleDownloadReport = () => {
    if (!responseData) {
      return;
    }

    const headers = [...masterDataImportConfig.columns.map((c) => c.header), 'Reason'];
    const sheetRows = tableRows.map((row) => {
      const values = masterDataImportConfig.columns.map((col) => row.cellsByColumn[col.column]?.value ?? '');
      values.push(row.reason);
      return values;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, 'master-data-import-results.xlsx');
  };

  if (!responseData) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              No import summary found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-yellow-900">
            <p>The latest master data import summary could not be located. Please upload a file to view results.</p>
            <Button asChild variant="outline">
              <Link href="/import">Go to Master Data Import</Link>
            </Button>
          </CardContent>
        </Card>
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
              <CardTitle className="text-xl">Master Data Import Results</CardTitle>
              <p className="text-sm text-muted-foreground">Review totals, download the report, and fix issues.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/import">Import Another File</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <SummaryCard label="Total Rows" value={responseData.totalRows} />
            <SummaryCard label="Total Items" value={responseData.totalItems} />
            <SummaryCard label="Successfully Imported" value={responseData.successCount} badgeTone="success" />
            <SummaryCard label="Duplicates" value={responseData.duplicateCount} badgeTone="warning" />
            <SummaryCard label="Failed Items" value={responseData.errorCount} badgeTone="error" />
          </div>
          {responseData.errors.length > 0 && (
            <div className="border rounded-md p-3 bg-red-50">
              <p className="text-sm font-medium text-red-800 mb-2">Validation summary</p>
              <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                {responseData.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-1">System message</p>
            <p className="text-sm">{responseData.message}</p>
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
                  {masterDataImportConfig.columns.map((col) => (
                    <TableHead key={col.column}>{col.header}</TableHead>
                  ))}
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell className="font-semibold">{row.rowNumber}</TableCell>
                    {masterDataImportConfig.columns.map((col) => {
                      const cell = row.cellsByColumn[col.column];
                      return (
                        <TableCell key={col.column}>
                          <div className="flex flex-col gap-1">
                            <span className={cell?.value ? 'font-medium' : 'text-muted-foreground'}>
                              {cell?.value || '—'}
                            </span>
                            {cell && (
                              <Badge
                                variant={
                                  cell.status === 'SUCCESS'
                                    ? 'outline'
                                    : cell.status === 'DUPLICATE'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="w-fit text-[10px]"
                              >
                                {cell.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-sm text-muted-foreground">
                      {row.reason || '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={masterDataImportConfig.columns.length + 2} className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No rows processed.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  badgeTone,
}: {
  label: string;
  value: number;
  badgeTone?: 'success' | 'warning' | 'error';
}) {
  const badgeVariant =
    badgeTone === 'success' ? 'default' : badgeTone === 'warning' ? 'secondary' : badgeTone === 'error' ? 'destructive' : undefined;

  return (
    <div className="flex flex-col p-3 border rounded-lg bg-muted/20">
      <span className="text-muted-foreground">{label}</span>
      {badgeVariant ? (
        <Badge variant={badgeVariant} className="mt-2 w-fit text-base px-3 py-1">
          {value}
        </Badge>
      ) : (
        <span className="font-semibold text-xl mt-2">{value}</span>
      )}
    </div>
  );
}

