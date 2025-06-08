'use client';

import { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import { OrganizationSetupForm } from './OrganizationSetupForm';
import { OrganizationWelcomePage } from './OrganizationWelcomePage';
import { useOrganizationSetup } from '@/hooks/useOrganizationSetup';
import { logoutAction } from '@/lib/auth-actions';

export function OrganizationSetupWizard() {
  const { state, actions } = useOrganizationSetup();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (state.isSetupRequired && !state.isSetupInProgress && !state.isSetupCompleted) {
      setShowForm(true);
    }
  }, [state.isSetupRequired, state.isSetupInProgress, state.isSetupCompleted]);

  // Header with logout button
  const Header = () => (
    <div className="absolute top-4 right-4 z-10">
      <form action={logoutAction}>
        <Button 
          type="submit" 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </form>
    </div>
  );

  // Show welcome page after successful setup
  if (state.showWelcome) {
    return <OrganizationWelcomePage />;
  }

  // Loading state
  if (!state.isSetupRequired && !state.isSetupCompleted && !state.error) {
    return (
      <div className="relative flex items-center justify-center min-h-screen">
        <Header />
        <div className="flex flex-col items-center space-y-4">
          <Coffee className="w-12 h-12 text-primary animate-bounce" />
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg">Checking organization setup...</span>
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
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-3xl text-green-700">Setup Complete!</CardTitle>
            <CardDescription className="text-lg">
              Your organization is ready to use CRM Cup.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to dashboard...
            </p>
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup/Sync in progress
  if (state.isSetupInProgress || state.isSyncInProgress) {
    const isSync = state.isSyncInProgress;
    return (
      <div className="relative container mx-auto max-w-2xl py-8">
        <Header />
        <Card>
          <CardHeader className="text-center">
            <Building2 className="w-20 h-20 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl">
              {isSync ? 'Syncing Organization Data' : 'Setting Up Organization'}
            </CardTitle>
            <CardDescription className="text-lg">
              {state.organizationName && 
                `${isSync ? 'Syncing' : 'Creating'} workspace for ${state.organizationName}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {isSync ? (
                <>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Checking organization in Spring backend...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Syncing user profile data...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Updating associations...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Creating Keycloak organization...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Setting up user membership...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Creating backend workspace...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Initializing user profile...</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This usually takes {isSync ? '15-30' : '30-60'} seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="relative container mx-auto max-w-2xl py-8">
        <Header />
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-3xl text-red-700">Setup Failed</CardTitle>
            <CardDescription className="text-lg">
              There was an issue setting up your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowForm(true)} 
                disabled={state.isSetupInProgress}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={actions.clearError}
                className="flex-1"
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Database className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Sync Organization Data
              </h1>
              <p className="text-lg text-muted-foreground">
                We found your organization <span className="font-semibold">{state.organizationName}</span> in Keycloak.
                Let's sync it to your CRM workspace.
              </p>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Sync Required</h3>
                    <p className="text-blue-700 text-sm">
                      Your organization exists in Keycloak but needs to be synced with the CRM database.
                      This will create your user profile and organization workspace.
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
      <Card>
        <CardHeader className="text-center">
          <Building2 className="w-20 h-20 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl">Welcome to CRM Cup</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your organization to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
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
  );
}
