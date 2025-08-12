// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CallFormProvider,
  useEntityForm,
} from '@/app/(protected)/(features)/calls/components/form/call-form-provider';
import { FormProgressIndicator } from '@/app/(protected)/(features)/calls/components/form/form-progress-indicator';
import { FormStepRenderer } from '@/app/(protected)/(features)/calls/components/form/form-step-renderer';
import { FormNavigation } from '@/app/(protected)/(features)/calls/components/form/form-navigation';
import { FormStateManager } from '@/app/(protected)/(features)/calls/components/form/form-state-manager';
import { FormErrorsDisplay } from '@/components/form-errors-display';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
// Import generated step components (uncommented by step generator)
import { stepComponents } from '@/app/(protected)/(features)/calls/components/form/steps';
import {
  useCreateCall,
  useUpdateCall,
  useGetCall,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import {
  callToast,
  handleCallError,
} from '@/app/(protected)/(features)/calls/components/call-toast';
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

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCall(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-call', id],
    },
  });

  // Update form values when entity data is loaded (for edit mode with generated steps)
  React.useEffect(() => {
    if (entity && !state.isLoading && config?.behavior?.rendering?.useGeneratedSteps) {
      const formValues: Record<string, any> = {};

      // Handle regular fields
      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name];

        if (fieldConfig.type === 'date') {
          // Convert to datetime-local format for the input
          if (value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                // Format as YYYY-MM-DDTHH:MM for datetime-local input
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

      // Handle relationships
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

  // Render generated step components based on current step
  const renderGeneratedStep = () => {
    const currentStepConfig = config.steps[state.currentStep];
    if (!currentStepConfig) return null;

    const stepProps = {
      form,
      config: config,
      actions,
    };

    // Use imported step components (requires manual import after generation)
    try {
      const StepComponent = stepComponents[currentStepConfig.id as keyof typeof stepComponents];
      if (StepComponent) {
        return <StepComponent {...stepProps} />;
      }
    } catch (error) {
      // Steps not imported yet
    }

    // Fallback message - replace with generated steps
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

  // Handle cancellation with cross-form navigation support
  const handleCancel = () => {
    if (hasReferrer()) {
      // Navigate back to referrer without any created entity
      navigateBackToReferrer();
    } else {
      // Fallback to traditional navigation
      const returnUrl = typeof window !== 'undefined' ? localStorage.getItem('returnUrl') : null;
      const backRoute = returnUrl || '/calls';

      // Clean up navigation localStorage (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('entityCreationContext');
        localStorage.removeItem('referrerInfo');
        localStorage.removeItem('returnUrl');
      }

      router.push(backRoute);
    }
  };

  // Loading state for edit mode
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

      {/* Navigation Protection Notice */}
      {state.isDirty && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Form Protection Active:</strong> Your changes will be protected. If you try
                to navigate away, you'll be prompted to save as draft.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar and Step Indicators */}
      <FormProgressIndicator />

      {/* Form Validation Errors Summary - Disabled */}
      {/* <FormErrorsDisplay 
        errors={state.errors}
        fieldLabels={{
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
        // Use generated step components
        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">{renderGeneratedStep()}</CardContent>
            </Card>
          </form>
        </Form>
      ) : (
        // Use dynamic step renderer (original approach)
        <FormStepRenderer entity={entity} />
      )}

      {/* Navigation */}
      <FormNavigation
        onCancel={handleCancel}
        onSubmit={async () => {}} // Empty function since submission is handled by form provider
        isSubmitting={false} // Will be handled by form provider state
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

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateCall({
    mutation: {
      onSuccess: async (data) => {
        const entityId = data?.id || data?.id;

        try {
          // Save remarks FIRST if any were added - WAIT for completion
          if (entityId && tempRemarksRef.current.length > 0) {
            await saveRemarksForCall(entityId, tempRemarksRef.current);
            // Clear the temp remarks after successful save
            tempRemarksRef.current = [];
          }

          // Invalidate queries to trigger table refetch
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

          // Only proceed with redirection after remarks are saved
          if (hasReferrer() && entityId) {
            // Don't show toast here - success will be shown on the referring form
            setIsRedirecting(true);
            navigateBackToReferrer(entityId, 'Call');
          } else {
            // Redirect to calls list with meeting dialog data
            callToast.created();
            setIsRedirecting(true);

            // Pass call data via URL parameters for meeting dialog
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
          // Continue with normal flow even if remarks fail, but show error
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
        // Invalidate queries to trigger table refetch
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

  // Show loading state when redirecting to prevent form validation errors
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
        // This callback receives the properly transformed data from the form provider

        // Extract temporary remarks before removing from data
        const tempRemarks = (transformedData as any).tempRemarks || [];

        // Store remarks in ref for saving after call creation
        tempRemarksRef.current = tempRemarks;

        // Remove tempRemarks from the data to be sent to API (as it's not a real call field)
        const { tempRemarks: _, ...callData } = transformedData as any;

        // Make the actual API call with the transformed data
        if (isNew) {
          createEntity({ data: callData });
        } else if (id) {
          // Ensure the entity data includes the ID for updates
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
