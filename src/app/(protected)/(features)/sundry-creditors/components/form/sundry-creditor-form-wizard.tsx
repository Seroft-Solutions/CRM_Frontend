'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SundryCreditorFormProvider, useEntityForm } from './sundry-creditor-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import { stepComponents } from './steps';
import {
  useCreateSundryCreditor,
  useGetSundryCreditor,
  useUpdateSundryCreditor,
} from '../../api/sundry-creditor';
import { sundryCreditorToast, handleSundryCreditorError } from '../sundry-creditor-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

interface SundryCreditorFormProps {
  id?: number;
}

function SundryCreditorFormContent({ id }: SundryCreditorFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetSundryCreditor(id || 0, {
    enabled: !!id,
    queryKey: ['getSundryCreditor', id],
  });

  React.useEffect(() => {
    if (entity && !state.isLoading && config?.behavior?.rendering?.useGeneratedSteps) {
      const formValues: Record<string, any> = {};

      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name as keyof typeof entity];

        if (fieldConfig.type === 'date') {
          if (value) {
            try {
              const date = new Date(value as string);
              if (!isNaN(date.getTime())) {
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
                formValues[fieldConfig.name] = adjustedDate.toISOString().slice(0, 16);
              } else {
                formValues[fieldConfig.name] = '';
              }
            } catch {
              formValues[fieldConfig.name] = '';
            }
          } else {
            formValues[fieldConfig.name] = '';
          }
        } else if (fieldConfig.type === 'number') {
          formValues[fieldConfig.name] = value != null ? String(value) : '';
        } else {
          formValues[fieldConfig.name] = value || '';
        }
      });

      config.relationships.forEach((relConfig) => {
        const value = entity[relConfig.name as keyof typeof entity];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value
            ? (value as any[]).map((item: any) => item[relConfig.primaryKey])
            : [];
        } else {
          if (relConfig.name === 'area') {
            formValues[relConfig.name] = value || null;
          } else {
            formValues[relConfig.name] = value ? (value as any)[relConfig.primaryKey] : undefined;
          }
        }
      });

      form.reset(formValues);
    }
  }, [entity, config, form, state.isLoading]);

  const renderGeneratedStep = () => {
    const currentStepConfig = config.steps[state.currentStep];
    if (!currentStepConfig) return null;

    const stepProps = {
      form,
      config: config,
      actions,
      entity,
    };

    try {
      const StepComponent = stepComponents[currentStepConfig.id as keyof typeof stepComponents];
      if (StepComponent) {
        return <StepComponent {...stepProps} />;
      }
    } catch (error) {
      console.error('Error loading step component:', error);
    }

    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Generated step components for "{currentStepConfig.id}" step would render here.
        </p>
      </div>
    );
  };

  const handleCancel = () => {
    if (hasReferrer()) {
      navigateBackToReferrer();
    } else {
      const returnUrl = typeof window !== 'undefined' ? localStorage.getItem('returnUrl') : null;
      const backRoute = returnUrl || '/sundry-creditors';

      if (typeof window !== 'undefined') {
        localStorage.removeItem('entityCreationContext');
        localStorage.removeItem('referrerInfo');
        localStorage.removeItem('returnUrl');
      }

      router.push(backRoute);
    }
  };

  if (id && isLoadingEntity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative">
      {/* Auto-population loading overlay */}
      {state.isAutoPopulating && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Setting up your form...</p>
          </div>
        </div>
      )}

      {/* Progress Bar and Step Indicators */}
      <FormProgressIndicator />

      {/* Form Content */}
      {config?.behavior?.rendering?.useGeneratedSteps ? (
        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">{renderGeneratedStep()}</CardContent>
            </Card>
          </form>
        </Form>
      ) : (
        <FormStepRenderer entity={entity} />
      )}

      {/* Navigation */}
      <FormNavigation
        onCancel={handleCancel}
        onSubmit={async () => { }}
        isSubmitting={false}
        isNew={isNew}
      />

      {/* State Management */}
      <FormStateManager entity={entity} />
    </div>
  );
}

export function SundryCreditorForm({ id }: SundryCreditorFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { mutate: createEntity, isPending: isCreating } = useCreateSundryCreditor({
    onSuccess: (data: any) => {
      const entityId = data?.id;

      queryClient.invalidateQueries({
        queryKey: ['getAllSundryCreditors'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['countSundryCreditors'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['searchSundryCreditors'],
        refetchType: 'active',
      });

      if (hasReferrer() && entityId) {
        setIsRedirecting(true);
        navigateBackToReferrer(entityId, 'SundryCreditor');
      } else {
        setIsRedirecting(true);
        sundryCreditorToast.created();
        router.push('/sundry-creditors');
      }
    },
    onError: (error: any) => {
      handleSundryCreditorError(error);
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateSundryCreditor({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['getAllSundryCreditors'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['countSundryCreditors'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['searchSundryCreditors'],
        refetchType: 'active',
      });

      setIsRedirecting(true);
      sundryCreditorToast.updated();
      router.push('/sundry-creditors');
    },
    onError: (error: any) => {
      handleSundryCreditorError(error);
    },
  });

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-card p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <SundryCreditorFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const { ...sundryCreditorData } = transformedData as any;
        // Default status if not provided, though config makes it required.
        const dataWithStatus = {
          ...sundryCreditorData,
          status: sundryCreditorData.status || 'ACTIVE',
        };

        if (isNew) {
          createEntity(dataWithStatus);
        } else if (id) {
          // Note: useUpdateSundryCreditor expects {id, data}
          updateEntity({ id, data: dataWithStatus });
        }
      }}
      onError={(error) => {
        handleSundryCreditorError(error);
      }}
    >
      <SundryCreditorFormContent id={id} />
    </SundryCreditorFormProvider>
  );
}
