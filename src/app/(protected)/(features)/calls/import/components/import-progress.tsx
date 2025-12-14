'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGetImportProgress } from '@/core/api/generated/spring';
import { CallImportJobDTO, CallImportJobDTOStatus } from '@/core/api/generated/spring/schemas';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImportProgressProps {
  jobId: string;
  onComplete?: (result: CallImportJobDTO) => void;
}

export function ImportProgress({ jobId, onComplete }: ImportProgressProps) {
  const router = useRouter();
  const [pollingInterval, setPollingInterval] = useState(2000); // 2 seconds
  const hasNavigated = React.useRef(false);

  const { data: progress, isLoading } = useGetImportProgress(jobId, {
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        // Stop polling when completed or failed
        if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
          return false;
        }
        return pollingInterval;
      },
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (progress?.status === 'COMPLETED' && !hasNavigated.current) {
      hasNavigated.current = true;

      // Save to sessionStorage for results page
      if (progress.result) {
        sessionStorage.setItem('callImportResponse', JSON.stringify(progress.result));
      }

      // Call onComplete callback
      if (onComplete) {
        onComplete(progress);
      }

      // Delay navigation slightly to show 100% completion
      const timer = setTimeout(() => {
        console.log('Navigating to results page...');
        router.push('/calls/import/results');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [progress?.status]);

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

  if (!progress) {
    return null;
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'PROCESSING':
      case 'PENDING':
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'PROCESSING':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const percentage = progress.progressPercentage || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          <span>Import Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filename */}
        {progress.filename && (
          <div className="text-sm text-muted-foreground">
            <strong>File:</strong> {progress.filename}
          </div>
        )}

        {/* Stage */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            {progress.stage || progress.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Row counts */}
        {progress.totalRows !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rows Processed:</span>
            <span className="font-semibold">
              {progress.processedRows || 0} / {progress.totalRows}
            </span>
          </div>
        )}

        {/* Statistics Grid */}
        {progress.status !== 'PENDING' && (progress.successCount !== undefined || progress.failedCount !== undefined) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {/* Success Count */}
            {progress.successCount !== undefined && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Success</span>
                <span className="text-lg font-bold text-green-600">{progress.successCount}</span>
              </div>
            )}

            {/* Duplicate Count */}
            {progress.duplicateCount !== undefined && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Duplicates</span>
                <span className="text-lg font-bold text-yellow-600">{progress.duplicateCount}</span>
              </div>
            )}

            {/* Failed Count */}
            {progress.failedCount !== undefined && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Failed</span>
                <span className="text-lg font-bold text-red-600">{progress.failedCount}</span>
              </div>
            )}

            {/* Validation Errors */}
            {progress.validationErrorCount !== undefined && progress.validationErrorCount > 0 && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Validation Errors</span>
                <span className="text-lg font-bold text-orange-600">{progress.validationErrorCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'FAILED' && progress.errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Error:</p>
            <p className="text-sm text-red-700 mt-1">{progress.errorMessage}</p>
          </div>
        )}

        {/* Completion Message */}
        {progress.status === 'COMPLETED' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">
              Import completed successfully! Redirecting to results...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
