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
  { key: 'Creating workspace schema', label: 'Setting up workspace', icon: Building2, progress: 25 },
  { key: 'Running migrations', label: 'Configuring database', icon: Database, progress: 60 },
  { key: 'Loading default data', label: 'Loading default data', icon: Settings, progress: 85 },
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

      // Find current step using simple keyword matching
      let stepIndex = -1;
      
      if (progressData.includes('Creating workspace schema') || progressData.includes('Initializing setup')) {
        stepIndex = 0;
      } else if (progressData.includes('Running migrations')) {
        stepIndex = 1;
        // Handle migration percentage updates
        const match = progressData.match(/(\d+)%/);
        if (match) {
          const percentage = parseInt(match[1]);
          setProgress(25 + (percentage * 0.35)); // 25% base + up to 35% for migrations (25% to 60%)
        } else {
          setProgress(setupSteps[stepIndex].progress);
        }
      } else if (progressData.includes('Loading') && progressData.includes('data')) {
        stepIndex = 2;
        // Handle data loading percentage updates
        const match = progressData.match(/(\d+)%/);
        if (match) {
          const percentage = parseInt(match[1]);
          setProgress(85 + (percentage * 0.1)); // 85% base + up to 10% for loading
        } else {
          setProgress(setupSteps[stepIndex].progress);
        }
      } else if (progressData === 'COMPLETED') {
        stepIndex = 3;
        setIsComplete(true);
        setTimeout(() => onComplete(), 1500);
      }
      
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        if ((stepIndex !== 1 && stepIndex !== 2) || !progressData.includes('%')) {
          setProgress(setupSteps[stepIndex].progress);
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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
            {isComplete ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Sparkles className="w-8 h-8 animate-pulse" />
            )}
          </div>
          {!isComplete && (
            <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-ping" />
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {isComplete ? 'Setup Complete!' : 'Setting Up Your Workspace'}
        </h1>
        <p className="text-muted-foreground">
          {isComplete 
            ? `Welcome to ${organizationName}! Redirecting to dashboard...`
            : `Creating workspace for ${organizationName}`
          }
        </p>
      </div>

      {/* Progress Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-muted"
            />
          </div>

          {/* Step List - Compact */}
          <div className="space-y-2">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const isCurrentStep = index === currentStep;
              const isCompleted = index < currentStep || isComplete;

              return (
                <div
                  key={step.key}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                    isCurrentStep
                      ? 'bg-primary/10 border border-primary/20'
                      : isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-muted/30'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isCurrentStep
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isCurrentStep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm ${
                        isCompleted
                          ? 'text-green-700'
                          : isCurrentStep
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isCompleted
                        ? 'Completed'
                        : isCurrentStep
                        ? 'In progress...'
                        : 'Pending'
                      }
                    </p>
                  </div>

                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Message - Compact */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-1">
              {!isComplete && (
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {isComplete
                  ? '🎉 Your workspace is ready!'
                  : progressData || 'Initializing setup...'
                }
              </p>
            </div>
            {!isComplete && (
              <p className="text-xs text-muted-foreground/70">
                ⚡ Setting up your personalized CRM workspace (2-5 minutes)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
