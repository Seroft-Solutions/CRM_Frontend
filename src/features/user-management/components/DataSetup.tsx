/**
 * Data Setup Component
 * Handles initial synchronization of Keycloak data to Spring Database
 * Used during organization setup or system initialization
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Shield,
  Settings,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useSystemSetup, useSetupStatus, useSyncStatus } from '../hooks';

interface DataSetupProps {
  organizationId: string;
  organizationName: string;
  onSetupComplete?: () => void;
  className?: string;
}

export function DataSetup({
  organizationId,
  organizationName,
  onSetupComplete,
  className,
}: DataSetupProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Setup hooks
  const { runSetup, isRunning, progress, error, result } = useSystemSetup();
  const { setupRequired, details, isLoading: checkingSetup, refetch: recheckSetup } = useSetupStatus();
  const { syncStatus, isLoading: checkingSync, refetch: recheckSync } = useSyncStatus();

  // Handle setup execution
  const handleRunSetup = async () => {
    try {
      await runSetup({ organizationId });
      await recheckSetup();
      await recheckSync();
      onSetupComplete?.();
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await Promise.all([recheckSetup(), recheckSync()]);
  };

  // Determine setup status
  const isSetupCompleted = !setupRequired && result?.success;
  const hasSetupErrors = result && !result.success && result.summary.errors.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Setup Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Synchronization Setup
          </CardTitle>
          <CardDescription>
            Synchronize existing Keycloak data to Spring Database for {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          {checkingSetup || checkingSync ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking synchronization status...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {details?.keycloakRoles || 0}
                </div>
                <div className="text-sm text-muted-foreground">Keycloak Roles</div>
                <div className="text-xs text-green-600">
                  {details?.springRoles || 0} in Spring
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {details?.keycloakGroups || 0}
                </div>
                <div className="text-sm text-muted-foreground">Keycloak Groups</div>
                <div className="text-xs text-green-600">
                  {details?.springGroups || 0} in Spring
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {details?.keycloakUsers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Keycloak Users</div>
                <div className="text-xs text-green-600">
                  {details?.springUsers || 0} in Spring
                </div>
              </div>
            </div>
          )}

          {/* Setup Required Alert */}
          {setupRequired && !isRunning && !isSetupCompleted && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Setup Required</AlertTitle>
              <AlertDescription className="text-orange-700">
                Your Spring Database needs to be synchronized with Keycloak data. This will populate
                existing roles, groups, and users from Keycloak into your Spring Database.
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Completed Alert */}
          {isSetupCompleted && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Setup Completed Successfully!</AlertTitle>
              <AlertDescription className="text-green-700">
                Created {result.summary.rolesCreated} roles, {result.summary.groupsCreated} groups,
                and {result.summary.usersCreated} users in Spring Database.
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Errors Alert */}
          {hasSetupErrors && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Setup Completed with Errors</AlertTitle>
              <AlertDescription className="text-red-700">
                Some items couldn't be synchronized. {result.summary.errors.length} errors occurred.
                <Button
                  variant="link"
                  className="p-0 h-auto text-red-700 underline"
                  onClick={() => setShowDetails(true)}
                >
                  View details
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isRunning && progress && (
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
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {setupRequired && !isSetupCompleted && (
              <Button 
                onClick={handleRunSetup} 
                disabled={isRunning} 
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Setup...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Start Data Synchronization
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRunning || checkingSetup || checkingSync}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(checkingSetup || checkingSync) ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>

            {(result || syncStatus) && (
              <Button
                variant="ghost"
                onClick={() => setShowDetails(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Current Sync Status
            </CardTitle>
            <CardDescription>
              Real-time synchronization status between Keycloak and Spring Database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${syncStatus.usersSynced ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium">Users</div>
                  <div className="text-sm text-muted-foreground">
                    {syncStatus.usersSynced ? 'Synchronized' : 'Needs Sync'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${syncStatus.groupsSynced ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium">Groups</div>
                  <div className="text-sm text-muted-foreground">
                    {syncStatus.groupsSynced ? 'Synchronized' : 'Needs Sync'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${syncStatus.rolesSynced ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium">Roles</div>
                  <div className="text-sm text-muted-foreground">
                    {syncStatus.rolesSynced ? 'Synchronized' : 'Needs Sync'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Setup Details</DialogTitle>
            <DialogDescription>
              Detailed information about the data synchronization process
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Setup Results */}
            {result && (
              <div className="space-y-3">
                <h4 className="font-medium">Setup Results</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-600">Created</div>
                    <div>Roles: {result.summary.rolesCreated}</div>
                    <div>Groups: {result.summary.groupsCreated}</div>
                    <div>Users: {result.summary.usersCreated}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">Existing</div>
                    <div>Roles: {result.details.existingRoles}</div>
                    <div>Groups: {result.details.existingGroups}</div>
                    <div>Users: {result.details.existingUsers}</div>
                  </div>
                </div>

                {result.summary.errors.length > 0 && (
                  <div>
                    <div className="font-medium text-red-600 mb-2">Errors</div>
                    <div className="space-y-1">
                      {result.summary.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sync Status Details */}
            {syncStatus && (
              <div className="space-y-3">
                <h4 className="font-medium">Current Sync Status</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-600">Keycloak</div>
                    <div>Roles: {syncStatus.details.keycloakRoles}</div>
                    <div>Groups: {syncStatus.details.keycloakGroups}</div>
                    <div>Users: {syncStatus.details.keycloakUsers}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">Spring</div>
                    <div>Roles: {syncStatus.details.springRoles}</div>
                    <div>Groups: {syncStatus.details.springGroups}</div>
                    <div>Users: {syncStatus.details.springUsers}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
