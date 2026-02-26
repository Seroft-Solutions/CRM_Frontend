'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationFormProvider, useEntityForm } from './organization-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import {
  useCreateOrganization,
  useGetOrganization,
  useUpdateOrganization,
} from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';
import { handleOrganizationError, organizationToast } from '../organization-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

interface OrganizationFormProps {
  id?: number;
}

function OrganizationFormContent({ id }: OrganizationFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetOrganization(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-organization', id],
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
    } catch (error) {}

    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Generated step components for "{currentStepConfig.id}" step would render here.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          1. Run: <code>node src/core/step-generator.js Organization</code>
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
      const backRoute = returnUrl || '/organizations';

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
          'keycloakOrgId': '',
          'name': '',
          'displayName': '',
          'domain': '',
          'status': '',
          'members': 'Members',
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

export function OrganizationForm({ id }: OrganizationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { mutateAsync: createEntityAsync } = useCreateOrganization();
  const { mutateAsync: updateEntityAsync } = useUpdateOrganization();

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
    <OrganizationFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const entityPayload = (transformedData ?? {}) as Record<string, any>;

        if (isNew) {
          const createdEntity = await createEntityAsync({ data: entityPayload as any });
          const createdEntityId = createdEntity?.id;

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['getAllOrganizations'],
              refetchType: 'active',
            }),
            queryClient.invalidateQueries({
              queryKey: ['countOrganizations'],
              refetchType: 'active',
            }),
            queryClient.invalidateQueries({
              queryKey: ['searchOrganizations'],
              refetchType: 'active',
            }),
          ]);

          if (hasReferrer() && createdEntityId) {
            setIsRedirecting(true);
            navigateBackToReferrer(createdEntityId, 'Organization');
            return;
          }

          setIsRedirecting(true);
          organizationToast.created();
          router.push('/organizations');
        } else if (id) {
          const entityData = { ...entityPayload, id };
          await updateEntityAsync({ id, data: entityData as any });

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['getAllOrganizations'],
              refetchType: 'active',
            }),
            queryClient.invalidateQueries({
              queryKey: ['countOrganizations'],
              refetchType: 'active',
            }),
            queryClient.invalidateQueries({
              queryKey: ['searchOrganizations'],
              refetchType: 'active',
            }),
          ]);

          setIsRedirecting(true);
          organizationToast.updated();
          router.push('/organizations');
        }
      }}
      onError={(error) => {
        handleOrganizationError(error);
      }}
    >
      <OrganizationFormContent id={id} />
    </OrganizationFormProvider>
  );
}
