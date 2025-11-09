'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FailedCallsTable } from '../components/failed-calls-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  useGetAllImportHistories
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';

type RowStatus = 'SUCCESS' | 'DUPLICATE' | 'VALIDATION_FAILED' | 'MASTER_DATA_MISSING' | 'SYSTEM_ERROR';

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
        const storedData = sessionStorage.getItem('importResponse');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                setResponseData(data);
                // Clear the data from session storage after reading it
                sessionStorage.removeItem('importResponse');
            } catch (error) {
                console.error("Failed to parse import response data:", error);
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
                        <p className="text-sm text-muted-foreground">Fetching the latest failed import rows from the backend.</p>
                    </CardContent>
                </Card>
            );
        }

        if (isImportHistoryError) {
            const errorMessage =
                importHistoryError instanceof Error ? importHistoryError.message : 'Unable to load import history data.';
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
                            We could not find any import history records. Start a new import or check back later for results.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return <FailedCallsTable />;
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
              We could not locate the latest summary in session storage. The table below still reflects the current import
              history stored in the backend.
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Import Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col p-4 border rounded-lg">
              <span className="text-muted-foreground">Total Rows</span>
              <span className="font-semibold text-2xl">{responseData.summary.totalRows}</span>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-green-50">
              <span className="text-muted-foreground">✅ Successful Rows</span>
              <Badge variant="default" className="mt-1 bg-green-100 text-green-800 w-fit">
                {responseData.summary.successCount}
              </Badge>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-yellow-50">
              <span className="text-muted-foreground">⚠️ Duplicates</span>
              <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800 w-fit">
                {responseData.summary.duplicateCount}
              </Badge>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-red-50">
              <span className="text-muted-foreground">❌ Failed Rows</span>
              <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800 w-fit">
                {responseData.summary.failedCount}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{responseData.summary.validationErrorCount}</p>
              <p>Validation issues</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{responseData.summary.masterMissingCount}</p>
              <p>Missing master data</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-foreground">{responseData.summary.systemErrorCount}</p>
              <p>System errors</p>
            </div>
          </div>
          <div className="border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">Message</p>
            <p className="text-sm text-muted-foreground">{responseData.message}</p>
          </div>
          {responseData.rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Row breakdown</p>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left border-r">Row #</th>
                      <th className="px-3 py-2 text-left border-r">Status</th>
                      <th className="px-3 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t">
                        <td className="px-3 py-2 border-r font-semibold">{row.rowNumber}</td>
                        <td className="px-3 py-2 border-r">
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
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Button asChild className="mt-4">
        <Link href="/calls/import">Import Another File</Link>
      </Button>

      {renderImportHistorySection()}
    </div>
  );
}
