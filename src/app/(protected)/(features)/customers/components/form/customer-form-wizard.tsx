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
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getAllCustomerAddresses,
  updateCustomerAddress,
  useGetAllCustomerAddresses,
} from '../../api/customer-address';

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

  const { data: addressData } = useGetAllCustomerAddresses(
    { page: 0, size: 1000, 'customerId.equals': id },
    {
      query: {
        enabled: !!id,
      },
    }
  );

  React.useEffect(() => {
    if (entity && !state.isLoading && config?.behavior?.rendering?.useGeneratedSteps) {
      const formValues: Record<string, any> = {};

      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name];

        if (fieldConfig.type === 'custom') {
          return;
        }

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

  React.useEffect(() => {
    if (!id) return;
    const dataArray = Array.isArray(addressData)
      ? addressData
      : addressData?.content
        ? addressData.content
        : addressData?.data
          ? addressData.data
          : [];

    const legacyAddress = (entity as any)?.completeAddress;

    if (dataArray.length > 0) {
      form.setValue(
        'addresses',
        dataArray.map((address: any) => ({
          id: address.id,
          completeAddress: address.completeAddress ?? '',
          isDefault: Boolean(address.isDefault),
        })),
        { shouldDirty: false }
      );
    } else if (legacyAddress) {
      form.setValue(
        'addresses',
        [{ completeAddress: legacyAddress, isDefault: true }],
        { shouldDirty: false }
      );
    }
  }, [addressData, entity, form, id]);

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

  const { mutateAsync: createEntity, isPending: isCreating } = useCreateCustomer();
  const { mutateAsync: updateEntity, isPending: isUpdating } = useUpdateCustomer();

  const normalizeAddressList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (data?.content) return data.content;
    if (data?.data) return data.data;
    return [];
  };

  const syncCustomerAddresses = async (customerId: number, addresses: any[], skipFetch = false) => {
    const trimmedAddresses = (addresses || [])
      .filter((address) => address?.completeAddress?.trim?.())
      .map((address) => ({
        id: address.id,
        completeAddress: address.completeAddress.trim(),
        isDefault: Boolean(address.isDefault),
      }));

    if (trimmedAddresses.length === 0) {
      return;
    }

    if (skipFetch) {
      await Promise.all(
        trimmedAddresses.map((address) =>
          createCustomerAddress({
            completeAddress: address.completeAddress,
            isDefault: address.isDefault,
            customer: { id: customerId, customerBusinessName: undefined },
          })
        )
      );
      return;
    }

    const existingResponse = await getAllCustomerAddresses({
      page: 0,
      size: 1000,
      'customerId.equals': customerId,
    });
    const existingAddresses = normalizeAddressList(existingResponse);
    const existingIds = new Set(existingAddresses.map((address: any) => address.id));
    const incomingIds = new Set(trimmedAddresses.filter((address) => address.id).map((address) => address.id));

    const updates = trimmedAddresses
      .filter((address) => address.id && existingIds.has(address.id))
      .map((address) =>
        updateCustomerAddress(address.id, {
          id: address.id,
          completeAddress: address.completeAddress,
          isDefault: address.isDefault,
          customer: { id: customerId, customerBusinessName: undefined },
        })
      );

    const creates = trimmedAddresses
      .filter((address) => !address.id)
      .map((address) =>
        createCustomerAddress({
          completeAddress: address.completeAddress,
          isDefault: address.isDefault,
          customer: { id: customerId, customerBusinessName: undefined },
        })
      );

    const deletions = existingAddresses
      .filter((address: any) => address.id && !incomingIds.has(address.id))
      .map((address: any) => deleteCustomerAddress(address.id));

    await Promise.all([...updates, ...creates, ...deletions]);
  };

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
        const { addresses, ...customerData } = transformedData as any;
        const defaultAddress =
          addresses?.find((address: any) => address.isDefault)?.completeAddress ??
          addresses?.[0]?.completeAddress;
        const customerDataWithStatus = {
          ...customerData,
          completeAddress: defaultAddress || undefined,
          status: 'ACTIVE',
        };

        if (isNew) {
          const created = await createEntity({ data: customerDataWithStatus as any });
          const createdId = created?.id;

          if (createdId) {
            await syncCustomerAddresses(createdId, addresses, true);
          }

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

          if (hasReferrer() && createdId) {
            setIsRedirecting(true);
            navigateBackToReferrer(createdId, 'Customer');
          } else {
            setIsRedirecting(true);
            customerToast.created();
            router.push('/customers');
          }
        } else if (id) {
          const entityData = { ...customerDataWithStatus, id };
          await updateEntity({ id, data: entityData as any });
          await syncCustomerAddresses(id, addresses);

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
