'use client';

import { [[entity]]Provider } from './context';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Card className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-center space-x-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </Card>
  );
}

export default function [[entity]]Layout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <[[entity]]Provider>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </[[entity]]Provider>
    </ErrorBoundary>
  );
}
