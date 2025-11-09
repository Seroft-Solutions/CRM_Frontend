'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FailedCallsTable } from '../components/failed-calls-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import {
  useGetAllImportHistories
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';

interface ImportResponse {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  skippedRows: number;
  failedRows: number;
  skippedErrors: string[];
  failedErrors: string[];
  skippedReportCsv: string;
  errorReportCsv: string;
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
                // sessionStorage.removeItem('importResponse');
            } catch (error) {
                console.error("Failed to parse import response data:", error);
                router.push('/calls/import');
            }
        } else {
            // If no data, redirect back to import page
            // router.push('/calls/import');
        }
    }, [router]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('importResponse');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setResponseData(data);
      } catch (error) {
        console.error('Failed to parse import response data:', error);
        router.push('/calls/import');
      }
    } else {
    }
  }, [router]);

  const handleDownloadErrorReport = () => {
    if (responseData?.errorReportCsv) {
      const blob = new Blob([responseData.errorReportCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'error-report.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

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
            {responseData ? (
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
                                <span className="text-muted-foreground">Total Rows Processed</span>
                                <span className="font-semibold text-2xl">{responseData.totalRows}</span>
                            </div>
                            <div className="flex flex-col p-4 border rounded-lg bg-green-50">
                                <span className="text-muted-foreground">✅ Successful Rows</span>
                                <Badge variant="default" className="mt-1 bg-green-100 text-green-800 w-fit">
                                    {responseData.successfulRows}
                                </Badge>
                            </div>
                            <div className="flex flex-col p-4 border rounded-lg bg-yellow-50">
                                <span className="text-muted-foreground">⚠️ Skipped Rows</span>
                                <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800 w-fit">
                                    {responseData.skippedRows}
                                </Badge>
                            </div>
                            <div className="flex flex-col p-4 border rounded-lg bg-red-50">
                                <span className="text-muted-foreground">❌ Failed Rows</span>
                                <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800 w-fit">
                                    {responseData.failedRows}
                                </Badge>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-2">Summary:</p>
                            <p className="text-sm">{responseData.message}</p>
                        </div>
                         {responseData.skippedRows > 0 && responseData.skippedReportCsv && (
                            <Button onClick={handleDownloadSkippedReport} variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download Skipped Report (.CSV)
                            </Button>
                        )}
                        {responseData.failedRows > 0 && responseData.errorReportCsv && (
                            <Button onClick={handleDownloadErrorReport} variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download Error Report (.CSV)
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
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
            )}

            {renderImportHistorySection()}

            {responseData?.skippedRows > 0 && responseData.skippedErrors && responseData.skippedErrors.length > 0 && (
                 <Card className="mt-6 border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800">
                            <AlertCircle className="h-5 w-5" />
                            Skipped Row Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 overflow-y-auto border border-yellow-200 rounded-md bg-yellow-50 p-2 text-sm">
                            <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                                {responseData.skippedErrors.map((err, index) => (
                                    <li key={index}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
             <Button asChild className="mt-4">
                <Link href="/calls/import">Import Another File</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
              <span className="text-muted-foreground">Total Rows Processed</span>
              <span className="font-semibold text-2xl">{responseData.totalRows}</span>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-green-50">
              <span className="text-muted-foreground">✅ Successful Rows</span>
              <Badge variant="default" className="mt-1 bg-green-100 text-green-800 w-fit">
                {responseData.successfulRows}
              </Badge>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-yellow-50">
              <span className="text-muted-foreground">⚠️ Skipped Rows</span>
              <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800 w-fit">
                {responseData.skippedRows}
              </Badge>
            </div>
            <div className="flex flex-col p-4 border rounded-lg bg-red-50">
              <span className="text-muted-foreground">❌ Failed Rows</span>
              <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800 w-fit">
                {responseData.failedRows}
              </Badge>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Summary:</p>
            <p className="text-sm">{responseData.message}</p>
          </div>
          {responseData.skippedRows > 0 && responseData.skippedReportCsv && (
            <Button
              onClick={handleDownloadSkippedReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Skipped Report (.CSV)
            </Button>
          )}
          {responseData.failedRows > 0 && responseData.errorReportCsv && (
            <Button
              onClick={handleDownloadErrorReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Error Report (.CSV)
            </Button>
          )}
        </CardContent>
      </Card>

      {responseData.failedRows > 0 && responseData.errorReportCsv && (
        <FailedCallsTable errorReportCsv={responseData.errorReportCsv} />
      )}

      {responseData.skippedRows > 0 &&
        responseData.skippedErrors &&
        responseData.skippedErrors.length > 0 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                Skipped Row Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto border border-yellow-200 rounded-md bg-yellow-50 p-2 text-sm">
                <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                  {responseData.skippedErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      <Button asChild className="mt-4">
        <Link href="/calls/import">Import Another File</Link>
      </Button>
    </div>
  );
}
