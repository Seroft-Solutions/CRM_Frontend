'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CallFormProvider, useEntityForm } from './call-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { FormErrorsDisplay } from '@/components/form-errors-display';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import { stepComponents } from './steps';
import {
  useCreateCall,
  useUpdateCall,
  useGetCall,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { callToast, handleCallError } from '../call-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { saveRemarksForCall } from '@/app/(protected)/(features)/calls/hooks/use-call-remarks';

interface CallFormProps {
  id?: number;
}

function CallFormContent({ id }: CallFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetCall(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-call', id],
    },
  });

  React.useEffect(() => {
    if (entity && !state.isLoading && config?.behavior?.rendering?.useGeneratedSteps) {
      const formValues: Record<string, any> = {};

      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name];

        if (fieldConfig.type === 'date') {
          if (value) {
            try {
              const date = new Date(value);
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
        const value = entity[relConfig.name];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value
            ? value.map((item: any) => item[relConfig.primaryKey])
            : [];
        } else {
          formValues[relConfig.name] = value ? value[relConfig.primaryKey] : undefined;
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
    } catch (error) {}

    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Generated step components for "{currentStepConfig.id}" step would render here.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          1. Run: <code>node src/core/step-generator.js Call</code>
          <br />
          2. Uncomment the import and usage above
        </p>
      </div>
    );
  };

  const handleCancel = () => {
    if (hasReferrer()) {
      navigateBackToReferrer();
    } else {
      const returnUrl = typeof window !== 'undefined' ? localStorage.getItem('returnUrl') : null;
      const backRoute = returnUrl || '/calls';

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

      {/* Form Validation Errors Summary - Disabled */}
      {/* <FormErrorsDisplay 
        errors={state.errors}
        fieldLabels={{
          'status': '',
          'priority': 'Priority',
          'callType': 'Call Type',
          'subCallType': 'Sub Call Type',
          'source': 'Source',
          'customer': 'Customer',
          'product': 'Product',
          'channelType': 'Channel Type',
          'channelParties': 'Channel Parties',
          'assignedTo': 'Assigned To',
          'callStatus': 'Call Status',
        }}
      /> */}

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
        onSubmit={async () => {}}
        isSubmitting={false}
        isNew={isNew}
      />

      {/* State Management */}
      <FormStateManager entity={entity} />
    </div>
  );
}

export function CallForm({ id }: CallFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const tempRemarksRef = useRef<any[]>([]);

  const { mutate: createEntity, isPending: isCreating } = useCreateCall({
    mutation: {
      onSuccess: async (data) => {
        const entityId = data?.id || data?.id;

        try {
          if (entityId && tempRemarksRef.current.length > 0) {
            await saveRemarksForCall(entityId, tempRemarksRef.current);

            tempRemarksRef.current = [];
          }

          queryClient.invalidateQueries({
            queryKey: ['getAllCalls'],
            refetchType: 'active',
          });
          queryClient.invalidateQueries({
            queryKey: ['countCalls'],
            refetchType: 'active',
          });

          queryClient.invalidateQueries({
            queryKey: ['searchCalls'],
            refetchType: 'active',
          });

          if (hasReferrer() && entityId) {
            setIsRedirecting(true);
            navigateBackToReferrer(entityId, 'Call');
          } else {
            callToast.created();
            setIsRedirecting(true);

            const params = new URLSearchParams({
              created: 'true',
              callId: data?.id?.toString() || '',
              customerId: data?.customer?.id?.toString() || '',
              assignedUserId: data?.assignedTo?.id?.toString() || '',
            });

            router.push(`/calls?${params.toString()}`);
          }
        } catch (error) {
          console.error('Error in onSuccess flow:', error);

          callToast.created();
          setIsRedirecting(true);
          router.push('/calls');
        }
      },
      onError: (error) => {
        handleCallError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCall({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['getAllCalls'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countCalls'],
          refetchType: 'active',
        });

        queryClient.invalidateQueries({
          queryKey: ['searchCalls'],
          refetchType: 'active',
        });

        setIsRedirecting(true);
        callToast.updated();
        router.push('/calls');
      },
      onError: (error) => {
        handleCallError(error);
      },
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
    <CallFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const tempRemarks = (transformedData as any).tempRemarks || [];

        tempRemarksRef.current = tempRemarks;

        const { tempRemarks: _, ...callData } = transformedData as any;

        const callDataWithStatus = {
          ...callData,
          status: 'ACTIVE',
        };

        if (isNew) {
          createEntity({ data: callDataWithStatus });
        } else if (id) {
          const entityData = { ...callData, id };
          updateEntity({ id, data: entityData });
        }
      }}
      onError={(error) => {
        handleCallError(error);
      }}
    >
      <CallFormContent id={id} />
    </CallFormProvider>
  );
}
