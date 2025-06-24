'use client';

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useEntityForm } from './available-time-slot-form-provider';
import { BasicInfoStep } from './steps/basic-info-step';
import { DateTimeStep } from './steps/date-time-step';
import { SettingsStep } from './steps/settings-step';
import { GeographicStep } from './steps/geographic-step';
import { UserAssignmentStep } from './steps/user-assignment-step';
import { ClassificationStep } from './steps/classification-step';
import { BusinessRelationsStep } from './steps/business-relations-step';
import { OtherRelationsStep } from './steps/other-relations-step';
import { ReviewStep } from './steps/review-step';

interface FormStepRendererProps {
  entity?: any;
}

export function FormStepRenderer({ entity }: FormStepRendererProps) {
  const { config, state, form } = useEntityForm();
  const currentStepConfig = config.steps[state.currentStep];

  // Update form values when entity data is loaded (for edit mode)
  useEffect(() => {
    if (entity && !state.isLoading) {
      const formValues: Record<string, any> = {};

      // Handle regular fields
      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name];

        if (fieldConfig.type === 'date') {
          formValues[fieldConfig.name] = value ? new Date(value) : undefined;
        } else if (fieldConfig.type === 'number') {
          formValues[fieldConfig.name] = value != null ? String(value) : '';
        } else {
          formValues[fieldConfig.name] = value || '';
        }
      });

      // Handle relationships
      config.relationships.forEach((relConfig) => {
        const value = entity[relConfig.name];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value?.map((item: any) => item[relConfig.primaryKey]);
        } else {
          formValues[relConfig.name] = value?.[relConfig.primaryKey];
        }
      });

      form.reset(formValues);
    }
  }, [entity, config, form, state.isLoading]);

  const renderCurrentStep = () => {
    if (!currentStepConfig) return null;

    const stepProps = {
      stepConfig: currentStepConfig,
      isActive: true,
      isCompleted: state.currentStep < state.currentStep,
    };

    switch (currentStepConfig.id) {
      case 'basic':
        return <BasicInfoStep {...stepProps} />;
      case 'dates':
        return <DateTimeStep {...stepProps} />;
      case 'settings':
        return <SettingsStep {...stepProps} />;
      case 'geographic':
        return <GeographicStep {...stepProps} />;
      case 'users':
        return <UserAssignmentStep {...stepProps} />;
      case 'classification':
        return <ClassificationStep {...stepProps} />;
      case 'business':
        return <BusinessRelationsStep {...stepProps} />;
      case 'other':
        return <OtherRelationsStep {...stepProps} />;
      case 'review':
        return <ReviewStep {...stepProps} />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unknown step: {currentStepConfig.id}</p>
          </div>
        );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">{renderCurrentStep()}</CardContent>
        </Card>
      </form>
    </Form>
  );
}
