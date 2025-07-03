/**
 * Dual Storage User Management Demo
 * Complete example showing how to use the new dual storage system
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Database,
  Users,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { DataSetup } from './DataSetup';
import { DualUserCreation } from './DualUserCreation';
import { OrganizationUsers } from './OrganizationUsers';
import { useOrganizationContext, useSyncStatus, useSetupStatus } from '../hooks';
import { PermissionGuard } from '@/core/auth';

interface DualStorageManagementProps {
  className?: string;
}

export function DualStorageManagement({ className }: DualStorageManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserCreation, setShowUserCreation] = useState(false);
  
  // Context and status hooks
  const { organizationId, organizationName } = useOrganizationContext();
  const { syncStatus, isLoading: syncLoading, refetch: refetchSync } = useSyncStatus();
  const { setupRequired, details, refetch: refetchSetup } = useSetupStatus();

  const handleUserCreated = (userId: string) => {
    setShowUserCreation(false);
    refetchSync();
    // Could navigate to user details or refresh user list
  };

  const handleSetupComplete = () => {
    refetchSetup();
    refetchSync();
  };

  if (!organizationId) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No organization context available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PermissionGuard requiredPermission="manage:users">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Dual storage system for {organizationName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                refetchSync();
                refetchSetup();
              }}
              disabled={syncLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Dialog open={showUserCreation} onOpenChange={setShowUserCreation}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a user in both Keycloak and Spring Database
                  </DialogDescription>
                </DialogHeader>
                <DualUserCreation
                  organizationId={organizationId}
                  organizationName={organizationName}
                  onUserCreated={handleUserCreated}
                  onCancel={() => setShowUserCreation(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current synchronization status between Keycloak and Spring Database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking synchronization status...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    syncStatus?.usersSynced ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">Users</div>
                    <div className="text-sm text-muted-foreground">
                      {syncStatus?.usersSynced ? 'Synchronized' : 'Needs Sync'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      KC: {syncStatus?.details.keycloakUsers || 0} | 
                      Spring: {syncStatus?.details.springUsers || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    syncStatus?.groupsSynced ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">Groups</div>
                    <div className="text-sm text-muted-foreground">
                      {syncStatus?.groupsSynced ? 'Synchronized' : 'Needs Sync'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      KC: {syncStatus?.details.keycloakGroups || 0} | 
                      Spring: {syncStatus?.details.springGroups || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    syncStatus?.rolesSynced ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">Roles</div>
                    <div className="text-sm text-muted-foreground">
                      {syncStatus?.rolesSynced ? 'Synchronized' : 'Needs Sync'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      KC: {syncStatus?.details.keycloakRoles || 0} | 
                      Spring: {syncStatus?.details.springRoles || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Required Alert */}
        {setupRequired && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Setup Required</AlertTitle>
            <AlertDescription className="text-orange-700">
              Your Spring Database needs initial synchronization with Keycloak data.
              Click the "Setup" tab to run the synchronization process.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dual Storage Architecture</CardTitle>
                <CardDescription>
                  Understanding the integrated Keycloak-Spring system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      Keycloak (Authentication)
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• User authentication & authorization</li>
                      <li>• Role and group management</li>
                      <li>• Organization membership</li>
                      <li>• Single Sign-On (SSO)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-600" />
                      Spring Database (Application)
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• User profiles & extended data</li>
                      <li>• Business logic integration</li>
                      <li>• Channel types & commissions</li>
                      <li>• Application-specific features</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Both systems stay synchronized automatically. When you create a user, 
                    they are added to both Keycloak and Spring Database. If one fails, 
                    the other is rolled back to maintain consistency.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <OrganizationUsers />
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup">
            <DataSetup
              organizationId={organizationId}
              organizationName={organizationName}
              onSetupComplete={handleSetupComplete}
            />
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dual Storage Usage Guide</CardTitle>
                <CardDescription>
                  How to work with the integrated system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Creation */}
                <div>
                  <h4 className="font-medium mb-3">Creating Users</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Users are automatically created in both systems when using the invitation or direct creation features.
                      The system ensures both Keycloak and Spring profiles are created consistently.
                    </p>
                    <div className="bg-muted p-3 rounded">
                      <strong>Steps:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Create user in Keycloak</li>
                        <li>Create corresponding profile in Spring Database</li>
                        <li>Assign groups and roles</li>
                        <li>Send invitation email (if needed)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* User Management */}
                <div>
                  <h4 className="font-medium mb-3">Managing Users</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      User data is pulled from both systems to provide a complete view. 
                      Authentication data comes from Keycloak, while profile data comes from Spring.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong>From Keycloak:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Email, username</li>
                          <li>Enabled/disabled status</li>
                          <li>Email verification</li>
                          <li>Assigned roles & groups</li>
                        </ul>
                      </div>
                      <div>
                        <strong>From Spring:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Phone number</li>
                          <li>Display name</li>
                          <li>Channel type</li>
                          <li>Business-specific data</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Setup Process */}
                <div>
                  <h4 className="font-medium mb-3">Initial Setup</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      When setting up a new organization, run the data synchronization to copy 
                      existing Keycloak data to Spring Database.
                    </p>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Best Practice:</strong> Run the setup process during organization 
                        creation to ensure all existing users, roles, and groups are available 
                        in both systems from the start.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div>
                  <h4 className="font-medium mb-3">Troubleshooting</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div>
                        <strong>User exists in Keycloak but not Spring:</strong>
                        <p>Re-run the setup process or manually invite the user to create their Spring profile.</p>
                      </div>
                      <div>
                        <strong>Sync status shows "Needs Sync":</strong>
                        <p>This is normal during active user creation. Run the setup process if the count difference is significant.</p>
                      </div>
                      <div>
                        <strong>User creation fails:</strong>
                        <p>Check the error message. If Keycloak creation succeeds but Spring fails, the Keycloak user is automatically rolled back.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
