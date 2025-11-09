'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerFormProvider, useEntityForm } from './customer-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import { stepComponents } from './steps';
import {
  useCreateCustomer,
  useGetCustomer,
  useUpdateCustomer,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { customerToast, handleCustomerError } from '../customer-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

interface CustomerFormProps {
  id?: number;
}

function CustomerFormContent({ id }: CustomerFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetCustomer(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-customer', id],
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
          if (relConfig.name === 'area') {
            formValues[relConfig.name] = value || null;
          } else {
            formValues[relConfig.name] = value ? value[relConfig.primaryKey] : undefined;
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
        <p className="text-sm text-muted-foreground mt-2">
          1. Run: <code>node src/core/step-generator.js Customer</code>
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
      const backRoute = returnUrl || '/customers';

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
          'customerBusinessName': '',
          'email': '',
          'mobile': '',
          'whatsApp': '',
          'contactPerson': '',
          'status': '',
          'state': 'State',
          'district': 'District',
          'city': 'City',
          'area': 'Area',
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

export function CustomerForm({ id }: CustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { mutate: createEntity, isPending: isCreating } = useCreateCustomer({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;

        queryClient.invalidateQueries({
          queryKey: ['getAllCustomers'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countCustomers'],
          refetchType: 'active',
        });

        queryClient.invalidateQueries({
          queryKey: ['searchCustomers'],
          refetchType: 'active',
        });

        if (hasReferrer() && entityId) {
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'Customer');
        } else {
          setIsRedirecting(true);
          customerToast.created();
          router.push('/customers');
        }
      },
      onError: (error) => {
        handleCustomerError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['getAllCustomers'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countCustomers'],
          refetchType: 'active',
        });

        queryClient.invalidateQueries({
          queryKey: ['searchCustomers'],
          refetchType: 'active',
        });

        setIsRedirecting(true);
        customerToast.updated();
        router.push('/customers');
      },
      onError: (error) => {
        handleCustomerError(error);
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
    <CustomerFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const { ...customerData } = transformedData as any;
        const customerDataWithStatus = {
          ...customerData,
          status: 'ACTIVE',
        };

        if (isNew) {
          createEntity({ data: customerDataWithStatus as any });
        } else if (id) {
          const entityData = { ...customerDataWithStatus, id };
          updateEntity({ id, data: entityData as any });
        }
      }}
      onError={(error) => {
        handleCustomerError(error);
      }}
    >
      <CustomerFormContent id={id} />
    </CustomerFormProvider>
  );
}
