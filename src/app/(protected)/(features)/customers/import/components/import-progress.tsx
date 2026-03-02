'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetImportProgress } from '@/core/api/generated/spring';

interface ImportProgressProps {
  jobId: string;
  onComplete?: () => void;
}

export function ImportProgress({ jobId, onComplete }: ImportProgressProps) {
  const router = useRouter();
  const hasNavigated = React.useRef(false);

  const { data: progress, isLoading } = useGetImportProgress(jobId, {
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        // Stop polling if completed or failed
        if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
          return false;
        }
        // Poll every 2 seconds
        return 2000;
      },
    },
  });

  useEffect(() => {
    if (progress?.status === 'COMPLETED' && !hasNavigated.current) {
      hasNavigated.current = true;

      // Save to sessionStorage for results page
      if (progress.result) {
        sessionStorage.setItem('customerImportResponse', JSON.stringify(progress.result));
      }

      // Call onComplete callback
      if (onComplete) {
        onComplete();
      }

      // Navigate to results page
      setTimeout(() => {
        router.push('/customers/import/results');
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

        {progress.status === 'PROCESSING' && (
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

        {progress.status === 'COMPLETED' && (
          <p className="text-sm text-green-600">
            Import completed successfully! Redirecting to results...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
