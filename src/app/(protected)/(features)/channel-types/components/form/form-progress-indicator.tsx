'use client';

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEntityForm } from './channel-type-form-provider';
import { useIsMobile } from '@/hooks/use-mobile';

export function FormProgressIndicator() {
  const { config, state, actions } = useEntityForm();
  const isMobile = useIsMobile();

  const progress = ((state.currentStep + 1) / config.steps.length) * 100;

  const handleStepClick = async (stepIndex: number) => {
    if (config.behavior.navigation.allowStepSkipping) {
      await actions.goToStep(stepIndex);
    }
  };

  return (
    <div className="space-y-4">
      {isMobile ? (
        <>
          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>
                Step {state.currentStep + 1} of {config.steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-sidebar-accent-soft"
              indicatorClassName="bg-sidebar-accent"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              {config.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all flex-shrink-0',
                      index < state.currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === state.currentStep
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-muted-foreground/30 text-muted-foreground',
                      config.behavior.navigation.allowStepSkipping &&
                        'cursor-pointer hover:border-primary'
                    )}
                    onClick={() => handleStepClick(index)}
                  >
                    {index < state.currentStep ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < config.steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-1 sm:mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Info */}
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold">
              {config.steps[state.currentStep]?.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {config.steps[state.currentStep]?.description}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Progress Bar with Integrated Step Info */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>
                Step {state.currentStep + 1} of {config.steps.length}
              </span>
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {config.steps[state.currentStep]?.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {config.steps[state.currentStep]?.description}
                </p>
              </div>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-sidebar-accent-soft"
              indicatorClassName="bg-sidebar-accent"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              {config.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all flex-shrink-0',
                      index < state.currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === state.currentStep
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-muted-foreground/30 text-muted-foreground',
                      config.behavior.navigation.allowStepSkipping &&
                        'cursor-pointer hover:border-primary'
                    )}
                    onClick={() => handleStepClick(index)}
                  >
                    {index < state.currentStep ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < config.steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-1 sm:mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
