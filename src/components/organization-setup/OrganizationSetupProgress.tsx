'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Database, 
  Settings, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useGetSetupProgress } from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';

interface OrganizationSetupProgressProps {
  organizationName: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const setupSteps = [
  { key: 'Creating schema...', label: 'Setting up workspace', icon: Building2, progress: 25 },
  { key: 'Running migrations...', label: 'Configuring database', icon: Database, progress: 50 },
  { key: 'Loading data...', label: 'Loading default data', icon: Settings, progress: 75 },
  { key: 'COMPLETED', label: 'Setup complete', icon: CheckCircle, progress: 100 },
];

export function OrganizationSetupProgress({ 
  organizationName, 
  onComplete, 
  onError 
}: OrganizationSetupProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Poll for setup progress
  const { data: progressData, isError, error } = useGetSetupProgress(
    organizationName,
    {
      query: {
        refetchInterval: 2000, // Poll every 2 seconds
        refetchIntervalInBackground: true,
        retry: 3,
      }
    }
  );

  useEffect(() => {
    if (progressData) {
      if (progressData.startsWith('FAILED:')) {
        setHasError(true);
        onError(progressData.replace('FAILED: ', ''));
        return;
      }

      // Find current step
      const stepIndex = setupSteps.findIndex(step => progressData.includes(step.key));
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        setProgress(setupSteps[stepIndex].progress);
        
        if (progressData === 'COMPLETED') {
          setIsComplete(true);
          setTimeout(() => onComplete(), 1500);
        }
      }
    }
  }, [progressData, onComplete, onError]);

  useEffect(() => {
    if (isError) {
      setHasError(true);
      onError(error?.message || 'Setup failed');
    }
  }, [isError, error, onError]);

  if (hasError) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-700">Setup Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            There was an issue setting up your organization workspace.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
            {isComplete ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <Sparkles className="w-10 h-10 animate-pulse" />
            )}
          </div>
          {!isComplete && (
            <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-ping" />
          )}
        </div>
        <h1 className="text-3xl font-bold">
          {isComplete ? 'Setup Complete!' : 'Setting Up Your Workspace'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {isComplete 
            ? `Welcome to ${organizationName}! Redirecting to dashboard...`
            : `Creating workspace for ${organizationName}`
          }
        </p>
      </div>

      {/* Progress Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-muted"
            />
          </div>

          {/* Step List */}
          <div className="space-y-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const isCurrentStep = index === currentStep;
              const isCompleted = index < currentStep || isComplete;
              const isFutureStep = index > currentStep && !isComplete;

              return (
                <div
                  key={step.key}
                  className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${
                    isCurrentStep
                      ? 'bg-primary/10 border border-primary/20 scale-105'
                      : isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-muted/50 border border-transparent'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isCurrentStep
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isCurrentStep ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4
                      className={`font-medium transition-colors ${
                        isCompleted
                          ? 'text-green-700'
                          : isCurrentStep
                          ? 'text-primary'
                          : isFutureStep
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p
                      className={`text-sm ${
                        isCurrentStep
                          ? 'text-primary/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isCompleted
                        ? 'Completed'
                        : isCurrentStep
                        ? 'In progress...'
                        : 'Pending'
                      }
                    </p>
                  </div>

                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isComplete
                ? '🎉 Your workspace is ready!'
                : progressData || 'Initializing setup...'
              }
            </p>
            {!isComplete && (
              <p className="text-xs text-muted-foreground mt-2">
                This usually takes 30-60 seconds
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
