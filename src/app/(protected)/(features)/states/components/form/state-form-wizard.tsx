// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StateFormProvider, useEntityForm } from "@/app/(protected)/(features)/states/components/form/state-form-provider";
import { FormProgressIndicator } from "@/app/(protected)/(features)/states/components/form/form-progress-indicator";
import { FormStepRenderer } from "@/app/(protected)/(features)/states/components/form/form-step-renderer";
import { FormNavigation } from "@/app/(protected)/(features)/states/components/form/form-navigation";
import { FormStateManager } from "@/app/(protected)/(features)/states/components/form/form-state-manager";
import { FormErrorsDisplay } from "@/components/form-errors-display";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
// Import generated step components (uncommented by step generator)
// import { stepComponents } from "@/app/(protected)/(features)/states/components/form/steps";
import { 
  useCreateState,
  useUpdateState,
  useGetState,
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import { stateToast, handleStateError } from "@/app/(protected)/(features)/states/components/state-toast";
import { useCrossFormNavigation } from "@/context/cross-form-navigation";
import { useQueryClient } from '@tanstack/react-query';

interface StateFormProps {
  id?: number;
}

function StateFormContent({ id }: StateFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetState(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-state", id]
    },
  });

  // Render generated step components based on current step
  const renderGeneratedStep = () => {
    const currentStepConfig = config.steps[state.currentStep];
    if (!currentStepConfig) return null;

    const stepProps = {
      form,
      config: config,
      actions
    };

    // Use imported step components (requires manual import after generation)
    try {
      // STEP_GENERATOR_START
      // const StepComponent = stepComponents[currentStepConfig.id as keyof typeof stepComponents];
      // if (StepComponent) {
      //   return <StepComponent {...stepProps} />;
      // }
      // STEP_GENERATOR_END
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
          1. Run: <code>node src/core/step-generator.js State</code><br/>
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
      const backRoute = returnUrl || "/states";
      
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

      {/* Progress Bar and Step Indicators */}
      <FormProgressIndicator />

      {/* Form Validation Errors Summary - Disabled */}
      {/* <FormErrorsDisplay 
        errors={state.errors}
        fieldLabels={{
          'name': '',
          'country': '',
        }}
      /> */}

      {/* Form Content */}
      {config?.behavior?.rendering?.useGeneratedSteps ? (
        // Use generated step components
        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                {renderGeneratedStep()}
              </CardContent>
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

export function StateForm({ id }: StateFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateState({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;
        
        // Invalidate queries to trigger table refetch
        queryClient.invalidateQueries({ 
          queryKey: ['getAllStates'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['countStates'],
          refetchType: 'active'
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['searchStates'],
          refetchType: 'active'
        });
        
        
        if (hasReferrer() && entityId) {
          // Don't show toast here - success will be shown on the referring form
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'State');
        } else {
          setIsRedirecting(true);
          stateToast.created();
          router.push("/states");
        }
      },
      onError: (error) => {
        handleStateError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateState({
    mutation: {
      onSuccess: () => {
        // Invalidate queries to trigger table refetch
        queryClient.invalidateQueries({ 
          queryKey: ['getAllStates'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['countStates'],
          refetchType: 'active'
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['searchStates'],
          refetchType: 'active'
        });
        
        
        setIsRedirecting(true);
        stateToast.updated();
        router.push("/states");
      },
      onError: (error) => {
        handleStateError(error);
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
    <StateFormProvider 
      id={id}
      onSuccess={async (transformedData) => {
        // This callback receives the properly transformed data from the form provider
        
        // Make the actual API call with the transformed data
        if (isNew) {
          createEntity({ data: transformedData as any });
        } else if (id) {
          // Ensure the entity data includes the ID for updates
          const entityData = { ...transformedData, id };
          updateEntity({ id, data: entityData as any });
        }
      }}
      onError={(error) => {
        handleStateError(error);
      }}
    >
      <StateFormContent id={id} />
    </StateFormProvider>
  );
}
