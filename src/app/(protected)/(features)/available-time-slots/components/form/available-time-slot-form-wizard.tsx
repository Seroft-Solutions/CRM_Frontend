'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvailableTimeSlotFormProvider, useEntityForm } from './available-time-slot-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { FormErrorsDisplay } from '@/components/form-errors-display';
import {
  useCreateAvailableTimeSlot,
  useUpdateAvailableTimeSlot,
  useGetAvailableTimeSlot,
} from '@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen';
import { availableTimeSlotToast, handleAvailableTimeSlotError } from '../available-time-slot-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';

interface AvailableTimeSlotFormProps {
  id?: number;
}

function AvailableTimeSlotFormContent({ id }: AvailableTimeSlotFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetAvailableTimeSlot(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-available-time-slot', id],
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
      const backRoute = returnUrl || '/available-time-slots';

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
          slotDateTime: '',
          duration: '',
          isBooked: '',
          bookedAt: '',
          user: 'User',
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

export function AvailableTimeSlotForm({ id }: AvailableTimeSlotFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateAvailableTimeSlot({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;

        if (hasReferrer() && entityId) {
          // Don't show toast here - success will be shown on the referring form
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'AvailableTimeSlot');
        } else {
          setIsRedirecting(true);
          availableTimeSlotToast.created();
          router.push('/available-time-slots');
        }
      },
      onError: (error) => {
        handleAvailableTimeSlotError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateAvailableTimeSlot({
    mutation: {
      onSuccess: () => {
        setIsRedirecting(true);
        availableTimeSlotToast.updated();
        router.push('/available-time-slots');
      },
      onError: (error) => {
        handleAvailableTimeSlotError(error);
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
    <AvailableTimeSlotFormProvider
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
        handleAvailableTimeSlotError(error);
      }}
    >
      <AvailableTimeSlotFormContent id={id} />
    </AvailableTimeSlotFormProvider>
  );
}
