'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Coffee,
  ArrowRight,
  Database,
  LogOut,
} from 'lucide-react';
import { OrganizationSetupForm } from "@/components/organization-setup/OrganizationSetupForm";
import { OrganizationWelcomePage } from "@/components/organization-setup/OrganizationWelcomePage";
import { OrganizationSetupProgress } from "@/components/organization-setup/OrganizationSetupProgress";
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useOrganizationSetup } from '@/hooks/useOrganizationSetup';
import { logoutAction } from '@/core/auth';

export function OrganizationSetupWizard() {
  const { data: organizations, isLoading } = useUserOrganizations();
  const { state, actions } = useOrganizationSetup();
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.isSetupRequired && !state.isSetupInProgress && !state.isSetupCompleted) {
      setShowForm(true);
    }
  }, [state.isSetupRequired, state.isSetupInProgress, state.isSetupCompleted]);

  // Redirect to organization-select if user has organizations (but not during setup)
  useEffect(() => {
    if (
      !isLoading &&
      organizations &&
      organizations.length > 0 &&
      !state.isSetupInProgress &&
      !state.isSyncInProgress &&
      !state.showWelcome
    ) {
      router.push('/organization-select');
    }
  }, [
    organizations,
    isLoading,
    router,
    state.isSetupInProgress,
    state.isSyncInProgress,
    state.showWelcome,
  ]);

  // Header with logout button
  const Header = () => (
    <div className="absolute top-4 right-4 z-10">
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </form>
    </div>
  );

  // Show welcome page after successful setup
  if (state.showWelcome) {
    return <OrganizationWelcomePage onFinish={actions.finishWelcome} />;
  }

  // Loading state
  if (!state.isSetupRequired && !state.isSetupCompleted && !state.error) {
    return (
      <div className="relative flex items-center justify-center min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
              <Coffee className="w-8 h-8 animate-bounce" />
            </div>
            <h1 className="text-2xl font-bold">Checking Setup</h1>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking organization setup...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup completed
  if (state.isSetupCompleted && !state.isSetupRequired) {
    return (
      <div className="relative container mx-auto max-w-2xl py-8">
        <Header />
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-green-700">Setup Complete!</h1>
            <p className="text-muted-foreground">Your organization is ready to use CRM Cup.</p>
          </div>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Redirecting to dashboard...</p>
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Setup/Sync in progress
  if (state.isSetupInProgress || state.isSyncInProgress) {
    const isSync = state.isSyncInProgress;

    // If we have an organization name, show the modern progress component
    if (state.organizationName) {
      return (
        <div className="relative container mx-auto py-8">
          <Header />
          <OrganizationSetupProgress
            organizationName={state.organizationName}
            onComplete={() => {
              actions.completeSetup();
              actions.setShowWelcome(true);
            }}
            onError={(error) => {
              actions.setError(error);
            }}
          />
        </div>
      );
    }

    // Fallback to original progress display
    return (
      <div className="relative container mx-auto max-w-2xl py-8">
        <Header />
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">
              {isSync ? 'Syncing Organization Data' : 'Setting Up Organization'}
            </h1>
            <p className="text-muted-foreground">
              {state.organizationName &&
                `${isSync ? 'Syncing' : 'Creating'} workspace for ${state.organizationName}`}
            </p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              {isSync ? (
                <>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Checking organization in Spring backend...</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Syncing user profile data...</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Updating associations...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Creating Keycloak organization...</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Setting up user membership...</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Creating backend workspace...</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Initializing user profile...</span>
                  </div>
                </>
              )}

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  This usually takes {isSync ? '15-30' : '30-60'} seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="relative container mx-auto max-w-2xl py-8">
        <Header />
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-red-700">Setup Failed</h1>
            <p className="text-muted-foreground">
              There was an issue setting up your organization.
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={actions.clearError} className="flex-1">
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Setup/Sync form
  if (showForm) {
    return (
      <div className="relative container mx-auto py-8">
        <Header />
        {/* User has organization in Keycloak - show sync option */}
        {state.organizationName ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
                <Database className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold">Sync Organization Data</h1>
              <p className="text-muted-foreground">
                We found your organization{' '}
                <span className="font-semibold">{state.organizationName}</span> in Keycloak. Let's
                sync it to your CRM workspace.
              </p>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Sync Required</h3>
                    <p className="text-blue-700 text-sm">
                      Your organization exists in Keycloak but needs to be synced with the CRM
                      database. This will create your user profile and organization workspace.
                    </p>
                  </div>
                  <Button
                    onClick={actions.syncExistingData}
                    disabled={state.isSyncInProgress}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {state.isSyncInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing Data...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Sync Organization
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* No organization - show setup form */
          <OrganizationSetupForm
            onSubmit={actions.setupOrganization}
            isLoading={state.isSetupInProgress}
            error={state.error}
          />
        )}
      </div>
    );
  }

  // Welcome screen
  return (
    <div className="relative container mx-auto max-w-2xl py-8">
      <Header />
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to CRM Cup</h1>
          <p className="text-muted-foreground">Let's set up your organization to get started</p>
        </div>
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="inline-flex items-center"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
