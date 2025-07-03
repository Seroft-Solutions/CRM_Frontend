/**
 * Organization Setup Data Sync Component
 * Simplified component for data synchronization during organization setup
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useSystemSetup, useSetupStatus } from '../hooks';

interface OrganizationDataSyncProps {
  organizationId: string;
  organizationName: string;
  onComplete: (success: boolean) => void;
  autoStart?: boolean;
  className?: string;
}

export function OrganizationDataSync({
  organizationId,
  organizationName,
  onComplete,
  autoStart = false,
  className,
}: OrganizationDataSyncProps) {
  const [hasStarted, setHasStarted] = useState(false);
  
  // Setup hooks
  const { runSetup, isRunning, progress, error, result } = useSystemSetup();
  const { setupRequired, details, isLoading: checkingSetup } = useSetupStatus();

  // Auto-start setup if required
  useEffect(() => {
    if (autoStart && setupRequired && !hasStarted && !isRunning) {
      handleStartSetup();
    }
  }, [autoStart, setupRequired, hasStarted, isRunning]);

  // Handle completion
  useEffect(() => {
    if (result) {
      onComplete(result.success);
    }
  }, [result, onComplete]);

  const handleStartSetup = async () => {
    setHasStarted(true);
    try {
      await runSetup({ organizationId });
    } catch (error) {
      console.error('Setup failed:', error);
      onComplete(false);
    }
  };

  const handleSkip = () => {
    onComplete(true); // Allow user to skip setup
  };

  // Show loading state while checking setup requirement
  if (checkingSetup) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking data synchronization requirements...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completion state
  if (result?.success) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Data Synchronization Complete!
          </h3>
          <p className="text-green-700 mb-4">
            Successfully synchronized {result.summary.rolesCreated} roles, {result.summary.groupsCreated} groups,
            and {result.summary.usersCreated} users to your database.
          </p>
          <Button onClick={() => onComplete(true)} className="gap-2">
            Continue Setup
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show setup required state
  if (setupRequired && !isRunning) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
          <CardDescription>
            Set up data synchronization for {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Your organization needs data synchronization to copy existing Keycloak users, roles, 
              and groups to your application database. This ensures full functionality across all features.
            </AlertDescription>
          </Alert>

          {details && (
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-xl font-bold text-blue-600">{details.keycloakRoles}</div>
                <div className="text-muted-foreground">Roles</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{details.keycloakGroups}</div>
                <div className="text-muted-foreground">Groups</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">{details.keycloakUsers}</div>
                <div className="text-muted-foreground">Users</div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleStartSetup} className="flex-1 gap-2">
              <Database className="h-4 w-4" />
              Start Synchronization
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show running state
  if (isRunning && progress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Synchronizing Data...
          </CardTitle>
          <CardDescription>
            Please wait while we set up your data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{progress.message}</span>
              <span className="text-sm text-muted-foreground">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="w-full" />
            {progress.details && (
              <div className="text-xs text-muted-foreground">
                Processing {progress.details.processed + 1} of {progress.details.total}
                {progress.details.currentItem && `: ${progress.details.currentItem}`}
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please don't close this window while synchronization is in progress.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || (result && !result.success)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Synchronization Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error?.message || 'Data synchronization encountered errors. You can continue setup and run synchronization later from the admin panel.'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={handleStartSetup} variant="outline" className="gap-2">
              <Database className="h-4 w-4" />
              Retry Synchronization
            </Button>
            <Button onClick={() => onComplete(true)} className="flex-1">
              Continue Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default state - no setup required
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Data Already Synchronized
        </h3>
        <p className="text-green-700 mb-4">
          Your organization data is already synchronized between Keycloak and the application database.
        </p>
        <Button onClick={() => onComplete(true)} className="gap-2">
          Continue Setup
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
