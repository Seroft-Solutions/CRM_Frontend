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
import { CallRemarkFormProvider, useEntityForm } from "./call-remark-form-provider";
import { FormProgressIndicator } from "./form-progress-indicator";
import { FormStepRenderer } from "./form-step-renderer";
import { FormNavigation } from "./form-navigation";
import { FormStateManager } from "./form-state-manager";
import { FormErrorsDisplay } from "@/components/form-errors-display";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
// Import generated step components (uncommented by step generator)
// import { stepComponents } from './steps';
import { 
  useCreateCallRemark,
  useUpdateCallRemark,
  useGetCallRemark,
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";
import { callRemarkToast, handleCallRemarkError } from "../call-remark-toast";
import { useCrossFormNavigation } from "@/context/cross-form-navigation";
import { useQueryClient } from '@tanstack/react-query';

interface CallRemarkFormProps {
  id?: number;
}

function CallRemarkFormContent({ id }: CallRemarkFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCallRemark(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call-remark", id]
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
          1. Run: <code>node src/core/step-generator.js CallRemark</code><br/>
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
      const backRoute = returnUrl || "/call-remarks";
      
      // Clean up navigation localStorage (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('entityCreationContext');
        localStorage.removeItem('referrerInfo');
        localStorage.removeItem('returnUrl');
      }
      
      router.push(backRoute);
    }
  };

  // Loading state for edit mode or during submission
  if ((id && isLoadingEntity) || state.isSubmitting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-card p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {id && isLoadingEntity ? 'Loading...' : 'Submitting...'}
          </p>
        </div>
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
          'remark': '',
          'dateTime': '',
          'call': 'Call',
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
        isSubmitting={state.isSubmitting} // Pass actual form provider state
        isNew={isNew}
      />

      {/* State Management */}
      <FormStateManager entity={entity} />
    </div>
  );
}

export function CallRemarkForm({ id }: CallRemarkFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateCallRemark({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;
        
        // Set redirecting state IMMEDIATELY to prevent any UI flashing
        setIsRedirecting(true);
        
        // Invalidate queries to trigger table refetch
        queryClient.invalidateQueries({ 
          queryKey: ['getAllCallRemarks'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['countCallRemarks'],
          refetchType: 'active'
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['searchCallRemarks'],
          refetchType: 'active'
        });
        
        
        if (hasReferrer() && entityId) {
          // Don't show toast here - success will be shown on the referring form
          navigateBackToReferrer(entityId, 'CallRemark');
        } else {
          callRemarkToast.created();
          router.push("/call-remarks");
        }
      },
      onError: (error) => {
        // Reset redirecting state on error
        setIsRedirecting(false);
        handleCallRemarkError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCallRemark({
    mutation: {
      onSuccess: () => {
        // Set redirecting state IMMEDIATELY to prevent any UI flashing
        setIsRedirecting(true);
        
        // Invalidate queries to trigger table refetch
        queryClient.invalidateQueries({ 
          queryKey: ['getAllCallRemarks'],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['countCallRemarks'],
          refetchType: 'active'
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['searchCallRemarks'],
          refetchType: 'active'
        });
        
        
        callRemarkToast.updated();
        router.push("/call-remarks");
      },
      onError: (error) => {
        // Reset redirecting state on error
        setIsRedirecting(false);
        handleCallRemarkError(error);
      },
    },
  });

  // Show loading state when redirecting OR during API submission to prevent form validation errors
  if (isRedirecting || isCreating || isUpdating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-card p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {isRedirecting ? 'Redirecting...' : 'Submitting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CallRemarkFormProvider 
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
        handleCallRemarkError(error);
      }}
    >
      <CallRemarkFormContent id={id} />
    </CallRemarkFormProvider>
  );
}
