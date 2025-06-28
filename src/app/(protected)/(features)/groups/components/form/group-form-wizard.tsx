'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GroupFormProvider, useEntityForm } from './group-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { FormErrorsDisplay } from '@/components/form-errors-display';
import {
  useCreateGroup,
  useUpdateGroup,
  useGetGroup,
} from '@/core/api/generated/spring/endpoints/group-resource/group-resource.gen';
import { groupToast, handleGroupError } from '../group-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';

interface GroupFormProps {
  id?: number;
}

function GroupFormContent({ id }: GroupFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetGroup(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-group', id],
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
      const backRoute = returnUrl || '/groups';

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
          keycloakGroupId: '',
          name: '',
          path: '',
          description: '',
          isActive: '',
          organization: 'Organization',
          members: 'Members',
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

export function GroupForm({ id }: GroupFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // API hooks - moved here so they can be used in onSuccess callback
  const { mutate: createEntity, isPending: isCreating } = useCreateGroup({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;

        if (hasReferrer() && entityId) {
          // Don't show toast here - success will be shown on the referring form
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'Group');
        } else {
          setIsRedirecting(true);
          groupToast.created();
          router.push('/groups');
        }
      },
      onError: (error) => {
        handleGroupError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateGroup({
    mutation: {
      onSuccess: () => {
        setIsRedirecting(true);
        groupToast.updated();
        router.push('/groups');
      },
      onError: (error) => {
        handleGroupError(error);
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
    <GroupFormProvider
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
        handleGroupError(error);
      }}
    >
      <GroupFormContent id={id} />
    </GroupFormProvider>
  );
}
