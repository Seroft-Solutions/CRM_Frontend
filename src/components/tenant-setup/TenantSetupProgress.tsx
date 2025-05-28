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
            <CheckCircle className="w-16 h-16 text-green-500" />
          ) : isFailed ? (
            <AlertCircle className="w-16 h-16 text-red-500" />
          ) : (
            <Coffee className="w-16 h-16 text-primary animate-bounce" />
          )}
        </div>
        
        <CardTitle className="text-2xl">
          {isCompleted ? 'Setup Complete!' : 
           isFailed ? 'Setup Failed' : 
           'Setting Up Your CRM'}
        </CardTitle>
        
        <CardDescription className="text-lg">
          {organizationName && (
            <span>
              Preparing <strong>{organizationName}</strong> for CRM Cup
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {!isFailed && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {currentStepName}
              </span>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {progressPercentage}%
              </Badge>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            {timeRemainingText && isInProgress && (
              <p className="text-xs text-muted-foreground text-center">
                {timeRemainingText}
              </p>
            )}
          </div>
        )}

        {/* Current Step Detail */}
        {progress?.currentStep && !isFailed && (
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <CurrentStepIcon className={`w-6 h-6 ${isInProgress ? 'animate-pulse' : ''} text-primary`} />
            <div>
              <p className="text-sm font-medium">{currentStepName}</p>
              <p className="text-xs text-muted-foreground">
                {STEP_DETAILS[progress.currentStep as keyof typeof STEP_DETAILS]}
              </p>
            </div>
          </div>
        )}

        {/* Progress Message */}
        {progress?.message && !isFailed && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
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
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Setup Steps Overview */}
        {isInProgress && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-center">Setup Steps</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(STEP_DETAILS).map(([step, description]) => {
                const StepIcon = STEP_ICONS[step as keyof typeof STEP_ICONS];
                const isCurrentStep = progress?.currentStep === step;
                const isCompletedStep = getStepOrder(step) < getStepOrder(progress?.currentStep);
                
                return (
                  <div 
                    key={step}
                    className={`flex items-center space-x-2 p-2 rounded ${
                      isCurrentStep ? 'bg-primary/10 border border-primary/20' : 
                      isCompletedStep ? 'bg-green-50 border border-green-200' :
                      'bg-muted/30'
                    }`}
                  >
                    <StepIcon className={`w-3 h-3 ${
                      isCurrentStep ? 'text-primary animate-pulse' :
                      isCompletedStep ? 'text-green-600' :
                      'text-muted-foreground'
                    }`} />
                    <span className={`${
                      isCurrentStep ? 'font-medium text-primary' :
                      isCompletedStep ? 'text-green-700' :
                      'text-muted-foreground'
                    }`}>
                      {getSetupStepName(step)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <div className="text-center space-y-2">
            <p className="text-green-700 font-medium">
              🎉 Your CRM workspace is ready!
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ll be redirected to your dashboard in a moment.
            </p>
          </div>
        )}

        {/* Setup Info */}
        {progress?.startTime && (
          <div className="text-center text-xs text-muted-foreground">
            Setup started at {new Date(progress.startTime).toLocaleTimeString()}
            {progress.endTime && (
              <span> • Completed at {new Date(progress.endTime).toLocaleTimeString()}</span>
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
