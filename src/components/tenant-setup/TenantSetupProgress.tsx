'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Database, 
  Settings, 
  FileText, 
  Sparkles,
  Coffee 
} from 'lucide-react';
import { TenantSetupProgressDTO, TenantSetupProgressDTOStatus } from '@/core/api/generated/spring/schemas';
import { getSetupStepName, getSetupProgressPercentage } from '@/hooks/useTenantSetup';

interface TenantSetupProgressProps {
  progress: TenantSetupProgressDTO | null;
  organizationName: string | null;
  onRetry?: () => void;
}

// Step icons mapping
const STEP_ICONS = {
  'VALIDATION': Settings,
  'SCHEMA_CREATION': Database,
  'MIGRATIONS': Database,
  'BOOTSTRAP_DATA': FileText,
  'FINALIZATION': Sparkles,
  'COMPLETED': CheckCircle,
};

// Step details for better UX
const STEP_DETAILS = {
  'VALIDATION': 'Validating your organization settings and configuration',
  'SCHEMA_CREATION': 'Creating your secure database workspace',
  'MIGRATIONS': 'Setting up database tables and structure',
  'BOOTSTRAP_DATA': 'Configuring default data for Indian market',
  'FINALIZATION': 'Finalizing setup and applying configurations',
  'COMPLETED': 'Your CRM workspace is ready to use!',
};

export function TenantSetupProgress({ 
  progress, 
  organizationName, 
  onRetry 
}: TenantSetupProgressProps) {
  const progressPercentage = getSetupProgressPercentage(progress);
  const currentStepName = getSetupStepName(progress?.currentStep);
  const isCompleted = progress?.status === TenantSetupProgressDTOStatus.COMPLETED;
  const isFailed = progress?.status === TenantSetupProgressDTOStatus.FAILED;
  const isInProgress = progress?.status === TenantSetupProgressDTOStatus.IN_PROGRESS;

  // Estimate time remaining
  const timeRemaining = progress?.estimatedTimeRemainingSeconds;
  const timeRemainingText = timeRemaining 
    ? `${Math.ceil(timeRemaining)}s remaining`
    : null;

  // Get current step icon
  const CurrentStepIcon = STEP_ICONS[progress?.currentStep as keyof typeof STEP_ICONS] || Settings;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {isCompleted ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : isFailed ? (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Coffee className="w-10 h-10 text-primary animate-bounce" />
            </div>
          )}
        </div>
        
        <CardTitle className="text-3xl">
          {isCompleted ? 'Setup Complete!' : 
           isFailed ? 'Setup Failed' : 
           'Setting Up Your CRM'}
        </CardTitle>
        
        <CardDescription className="text-lg">
          {organizationName && (
            <span>
              {isCompleted ? 'Welcome to' : 'Preparing'} <strong>{organizationName}</strong> workspace
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {!isFailed && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center">
                <CurrentStepIcon className="w-4 h-4 mr-2 text-primary" />
                {currentStepName}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
                {timeRemainingText && isInProgress && (
                  <Badge variant="outline" className="text-xs">
                    {timeRemainingText}
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progressPercentage} className="w-full h-3" />
          </div>
        )}

        {/* Current Step Detail */}
        {progress?.currentStep && !isFailed && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${isInProgress ? 'animate-pulse' : ''}`}>
                    <CurrentStepIcon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground">{currentStepName}</p>
                  <p className="text-sm text-muted-foreground">
                    {STEP_DETAILS[progress.currentStep as keyof typeof STEP_DETAILS]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Message */}
        {progress?.message && !isFailed && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {progress.message}
            </p>
          </div>
        )}

        {/* Error Message */}
        {isFailed && progress?.errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {progress.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Retry Button for Failed State */}
        {isFailed && onRetry && (
          <div className="flex justify-center">
            <Button onClick={onRetry} variant="outline" className="min-w-[150px]">
              <Coffee className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Setup Steps Overview - Horizontal Progress */}
        {isInProgress && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium text-center mb-4">Setup Progress</h4>
              <div className="flex justify-between items-center relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted"></div>
                <div 
                  className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
                  style={{ width: `${(getStepOrder(progress?.currentStep) / 5) * 100}%` }}
                ></div>
                
                {Object.entries(STEP_DETAILS).filter(([key]) => key !== 'COMPLETED').map(([step, description], index) => {
                  const StepIcon = STEP_ICONS[step as keyof typeof STEP_ICONS];
                  const isCurrentStep = progress?.currentStep === step;
                  const isCompletedStep = getStepOrder(step) < getStepOrder(progress?.currentStep);
                  
                  return (
                    <div key={step} className="flex flex-col items-center space-y-2 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300 ${
                        isCompletedStep ? 'border-primary bg-primary text-primary-foreground' : 
                        isCurrentStep ? 'border-primary text-primary animate-pulse' : 
                        'border-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {isCompletedStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-medium ${
                          isCurrentStep ? 'text-primary' : 
                          isCompletedStep ? 'text-primary' : 
                          'text-muted-foreground'
                        }`}>
                          Step {index + 1}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center space-y-3">
                <p className="text-green-700 font-semibold text-lg">
                  🎉 Your CRM workspace is ready!
                </p>
                <p className="text-sm text-green-600">
                  You&apos;ll be redirected to your dashboard in a moment.
                </p>
                <div className="flex justify-center">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Info */}
        {progress?.startTime && (
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            Started at {new Date(progress.startTime).toLocaleTimeString()}
            {progress.endTime && (
              <span className="ml-2">• Completed at {new Date(progress.endTime).toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to determine step order
function getStepOrder(step: string | undefined): number {
  const stepOrder: Record<string, number> = {
    'VALIDATION': 1,
    'SCHEMA_CREATION': 2,
    'MIGRATIONS': 3,
    'BOOTSTRAP_DATA': 4,
    'FINALIZATION': 5,
    'COMPLETED': 6,
  };
  
  return stepOrder[step || ''] || 0;
}
