"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvailabilityFormProvider, useEntityForm } from "./user-availability-form-provider";
import { FormProgressIndicator } from "./form-progress-indicator";
import { FormStepRenderer } from "./form-step-renderer";
import { FormNavigation } from "./form-navigation";
import { FormStateManager } from "./form-state-manager";
import { FormErrorsDisplay } from "@/components/form-errors-display";
import { 
  useCreateUserAvailability,
  useUpdateUserAvailability,
  useGetUserAvailability,
} from "@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen";
import { userAvailabilityToast, handleUserAvailabilityError } from "../user-availability-toast";
import { useCrossFormNavigation } from "@/context/cross-form-navigation";

interface UserAvailabilityFormProps {
  id?: number;
}

function UserAvailabilityFormContent({ id }: UserAvailabilityFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetUserAvailability(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-user-availability", id]
    },
  });

  // Handle cancellation with cross-form navigation support
  const handleCancel = () => {
    if (hasReferrer()) {
      // Navigate back to referrer without any created entity
      navigateBackToReferrer();
    } else {
      // Fallback to traditional navigation
      const returnUrl = localStorage.getItem('returnUrl');
      const backRoute = returnUrl || "/user-availabilities";
      
      // Clean up navigation localStorage
      localStorage.removeItem('entityCreationContext');
      localStorage.removeItem('referrerInfo');
      localStorage.removeItem('returnUrl');
      
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
          'dayOfWeek': '',
          'startTime': '',
          'endTime': '',
          'isAvailable': '',
          'effectiveFrom': '',
          'effectiveTo': '',
          'timeZone': '',
          'user': 'User',
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

export function UserAvailabilityForm({ id }: UserAvailabilityFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateUserAvailability({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;
        console.log('🟢 UserAvailability created successfully with ID:', entityId);
        
        if (hasReferrer() && entityId) {
          console.log('🟢 Has referrer, navigating back with entity ID:', entityId);
          // Don't show toast here - success will be shown on the referring form
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'UserAvailability');
        } else {
          console.log('🟢 No referrer, going to user-availabilities list');
          setIsRedirecting(true);
          userAvailabilityToast.created();
          router.push("/user-availabilities");
        }
      },
      onError: (error) => {
        console.error('🔴 UserAvailability creation failed:', error);
        handleUserAvailabilityError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateUserAvailability({
    mutation: {
      onSuccess: () => {
        setIsRedirecting(true);
        userAvailabilityToast.updated();
        router.push("/user-availabilities");
      },
      onError: (error) => {
        handleUserAvailabilityError(error);
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
    <UserAvailabilityFormProvider 
      id={id}
      onSuccess={async (transformedData) => {
        // This callback receives the properly transformed data from the form provider
        console.log('🔵 FORM PROVIDER onSuccess called with transformed data:', transformedData);
        console.log('🔵 MAKING API CALL with data:', JSON.stringify(transformedData, null, 2));
        
        // Make the actual API call with the transformed data
        if (isNew) {
          console.log('🔵 CALLING createEntity with transformed data');
          createEntity({ data: transformedData as any });
        } else if (id) {
          console.log('🔵 CALLING updateEntity with transformed data');
          updateEntity({ id, data: transformedData as any });
        }
      }}
      onError={(error) => {
        console.error('🔵 FORM PROVIDER onError:', error);
        handleUserAvailabilityError(error);
      }}
    >
      <UserAvailabilityFormContent id={id} />
    </UserAvailabilityFormProvider>
  );
}
