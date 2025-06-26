"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CallFormProvider, useEntityForm } from "./call-form-provider";
import { FormProgressIndicator } from "./form-progress-indicator";
import { FormStepRenderer } from "./form-step-renderer";
import { FormNavigation } from "./form-navigation";
import { FormStateManager } from "./form-state-manager";
import { FormErrorsDisplay } from "@/components/form-errors-display";
import { 
  useCreateCall,
  useUpdateCall,
  useGetCall,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import { callToast, handleCallError } from "../call-toast";
import { useCrossFormNavigation } from "@/context/cross-form-navigation";
import { MeetingSchedulerDialog } from "./meeting-scheduler-dialog";

interface CallFormProps {
  id?: number;
}

function CallFormContent({ id }: CallFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCall(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call", id]
    },
  });

  // Handle cancellation with cross-form navigation support
  const handleCancel = () => {
    if (hasReferrer()) {
      // Navigate back to referrer without any created entity
      navigateBackToReferrer();
    } else {
      // Fallback to traditional navigation
      const returnUrl = typeof window !== 'undefined' ? localStorage.getItem('returnUrl') : null;
      const backRoute = returnUrl || "/calls";
      
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

      {/* Form Validation Errors Summary */}
      <FormErrorsDisplay 
        errors={state.errors}
        fieldLabels={{
          'callDateTime': '',
          'priority': 'Priority',
          'callType': 'Call Type',
          'subCallType': 'Sub Call Type',
          'callCategory': 'Call Category',
          'source': 'Source',
          'customer': 'Customer',
          'channelType': 'Channel Type',
          'channelParties': 'Channel Parties',
          'assignedTo': 'Assigned To',
          'callStatus': 'Call Status',
        }}
      />

      {/* Form Content */}
      <FormStepRenderer entity={entity} />

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
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Meeting scheduler dialog state
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [createdCallData, setCreatedCallData] = useState<any>(null);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateCall({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;
        
        if (hasReferrer() && entityId) {
          // Don't show toast here - success will be shown on the referring form
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'Call');
        } else {
          // Store the created call data and show meeting scheduler dialog
          setCreatedCallData(data);
          setShowMeetingDialog(true);
          callToast.created();
        }
      },
      onError: (error) => {
        handleCallError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCall({
    mutation: {
      onSuccess: (data) => {
        // For updates, optionally show meeting scheduler dialog too
        setCreatedCallData(data);
        setShowMeetingDialog(true);
        callToast.updated();
      },
      onError: (error) => {
        handleCallError(error);
      },
    },
  });

  const handleMeetingScheduled = (meetingData: any) => {
    // Meeting was successfully scheduled, now redirect
    setIsRedirecting(true);
    router.push("/calls");
  };

  const handleMeetingDialogClose = () => {
    // User declined to schedule meeting, just redirect
    setShowMeetingDialog(false);
    setIsRedirecting(true);
    router.push("/calls");
  };

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
    <>
      {/* Only show call form when dialog is not open */}
      {!showMeetingDialog && (
        <CallFormProvider 
          id={id}
          onSuccess={async (transformedData) => {
            // This callback receives the properly transformed data from the form provider
            
            // Make the actual API call with the transformed data
            if (isNew) {
              createEntity({ data: transformedData as any });
            } else if (id) {
              updateEntity({ id, data: transformedData as any });
            }
          }}
          onError={(error) => {
            handleCallError(error);
          }}
        >
          <CallFormContent id={id} />
        </CallFormProvider>
      )}

      {/* Show success message when dialog is open */}
      {showMeetingDialog && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center border max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Call Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Your call has been saved. Would you like to schedule a follow-up meeting?
            </p>
          </div>
        </div>
      )}

      {/* Meeting Scheduler Dialog */}
      <MeetingSchedulerDialog
        open={showMeetingDialog}
        onOpenChangeAction={handleMeetingDialogClose}
        customerId={createdCallData?.customer?.id}
        assignedUserId={createdCallData?.assignedTo?.id}
        callId={createdCallData?.id}
        onMeetingScheduledAction={handleMeetingScheduled}
      />
    </>
  );
}
