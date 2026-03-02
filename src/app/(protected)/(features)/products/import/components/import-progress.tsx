'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetImportProgress, ProductImportJobDTOStatus } from '@/core/api/generated/spring';

interface ImportProgressProps {
  jobId: string;
  onComplete?: () => void;
}

export function ImportProgress({ jobId, onComplete }: ImportProgressProps) {
  const router = useRouter();
  const hasNavigated = React.useRef(false);

  const {
    data: progress,
    isLoading,
    error,
  } = useGetImportProgress(jobId, {
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;

        // Stop polling if completed or failed
        if (
          data?.status === ProductImportJobDTOStatus.COMPLETED ||
          data?.status === ProductImportJobDTOStatus.FAILED
        ) {
          return false;
        }

        // Poll every 2 seconds
        return 2000;
      },
      retry: (failureCount, error) => {
        // Retry up to 3 times for network errors
        return failureCount < 3 && error?.message?.includes('network');
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  });

  useEffect(() => {
    if (progress?.status === ProductImportJobDTOStatus.COMPLETED && !hasNavigated.current) {
      hasNavigated.current = true;

      // Save to sessionStorage for results page
      if (progress.result) {
        sessionStorage.setItem('productImportResponse', JSON.stringify(progress.result));
      }

      // Call onComplete callback
      if (onComplete) {
        onComplete();
      }

      // Navigate to results page
      setTimeout(() => {
        router.push('/products/import/results');
      }, 1500);
    }
  }, [progress, onComplete, router]);

  if (isLoading && !progress) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading progress...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Connection Error</h3>
            <p className="mt-1 text-sm text-gray-500">
              Unable to fetch import progress. The import may still be running.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-2">Loading import status...</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case ProductImportJobDTOStatus.COMPLETED:
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case ProductImportJobDTOStatus.FAILED:
        return <XCircle className="h-6 w-6 text-red-500" />;
      case ProductImportJobDTOStatus.PROCESSING:
      case ProductImportJobDTOStatus.PENDING:
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case ProductImportJobDTOStatus.COMPLETED:
        return 'text-green-600';
      case ProductImportJobDTOStatus.FAILED:
        return 'text-red-600';
      case ProductImportJobDTOStatus.PROCESSING:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const progressPercentage = progress.progressPercentage || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          <span>Import Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={getStatusColor()}>{progress.status}</span>
            <span className="text-muted-foreground">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Stage</p>
            <p className="font-medium">{progress.stage || 'Initializing'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Processed</p>
            <p className="font-medium">
              {progress.processedRows || 0} / {progress.totalRows || 0}
            </p>
          </div>
        </div>

        {progress.status === ProductImportJobDTOStatus.PROCESSING && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-green-50 rounded">
              <p className="text-green-800 font-medium">{progress.successCount || 0}</p>
              <p className="text-green-600">Success</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 font-medium">{progress.duplicateCount || 0}</p>
              <p className="text-yellow-600">Duplicates</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="text-red-800 font-medium">{progress.failedCount || 0}</p>
              <p className="text-red-600">Failed</p>
            </div>
          </div>
        )}

        {progress.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {progress.errorMessage}
          </div>
        )}

        {progress.status === ProductImportJobDTOStatus.COMPLETED && (
          <p className="text-sm text-green-600">
            Import completed successfully! Redirecting to results...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
