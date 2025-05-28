'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, CheckCircle, AlertCircle, Loader2, Coffee } from 'lucide-react';
import { TenantSetupForm } from './TenantSetupForm';
import { TenantSetupProgress } from './TenantSetupProgress';
import { UseTenantSetupResult } from '@/hooks/useTenantSetup';
import { TenantSetupRequestDTO } from '@/core/api/generated/spring/schemas';

interface TenantSetupWizardProps {
  tenantSetup: UseTenantSetupResult;
}

export function TenantSetupWizard({ tenantSetup }: TenantSetupWizardProps) {
  const { state, actions } = tenantSetup;
  const [setupRequest, setSetupRequest] = useState<Partial<TenantSetupRequestDTO>>({});
  const [showForm, setShowForm] = useState(false);

  // Auto-proceed to form if setup is required and we have organization info
  useEffect(() => {
    if (state.isSetupRequired && state.organizationName && !state.isSetupInProgress) {
      setShowForm(true);
    }
  }, [state.isSetupRequired, state.organizationName, state.isSetupInProgress]);

  // Handle setup initiation
  const handleStartSetup = async () => {
    await actions.initiateSetup(setupRequest);
  };

  // Show loading state while checking tenant
  if (state.isCheckingTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Coffee className="w-12 h-12 text-primary animate-bounce" />
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg">Checking your organization setup...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show setup completed state
  if (state.isSetupCompleted && !state.isSetupRequired) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
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

  // Show setup in progress
  if (state.isSetupInProgress) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <TenantSetupProgress 
          progress={state.setupProgress}
          organizationName={state.organizationName}
          onRetry={actions.retrySetup}
        />
      </div>
    );
  }

  // Show error state with retry option
  if (state.error) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
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
                onClick={actions.retrySetup} 
                disabled={state.isInitiatingSetup}
                className="flex-1"
              >
                {state.isInitiatingSetup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Retry Setup
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

  // Show welcome and setup form
  if (showForm) {
    return (
      <div className="container mx-auto py-8">
        <TenantSetupForm
          organizationName={state.organizationName || ''}
          onSetupRequest={setSetupRequest}
          onStartSetup={handleStartSetup}
          isLoading={state.isInitiatingSetup}
        />
      </div>
    );
  }

  // Fallback - should not reach here in normal flow
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle>Organization Setup</CardTitle>
          <CardDescription>
            Setting up your CRM workspace...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </CardContent>
      </Card>
    </div>
  );
}
