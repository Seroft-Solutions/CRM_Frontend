'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SundryCreditorFormProvider, useEntityForm } from './sundry-creditor-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import { stepComponents } from './steps';
import {
  useCreateSundryCreditor,
  useGetSundryCreditor,
  useUpdateSundryCreditor,
} from '../../api/sundry-creditor';
import {
  createSundryCreditorAddress,
  deleteSundryCreditorAddress,
  getAllSundryCreditorAddresses,
  updateSundryCreditorAddress,
  useGetAllSundryCreditorAddresses,
} from '../../api/sundry-creditor-address';
import { sundryCreditorToast, handleSundryCreditorError } from '../sundry-creditor-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

interface SundryCreditorFormProps {
  id?: number;
}

function SundryCreditorFormContent({ id }: SundryCreditorFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetSundryCreditor(id || 0, {
    enabled: !!id,
    queryKey: ['getSundryCreditor', id],
  });

  const { data: addressData } = useGetAllSundryCreditorAddresses(
    { page: 0, size: 1000, 'sundryCreditorId.equals': id },
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
        const value = entity[fieldConfig.name as keyof typeof entity];

        if ((fieldConfig.type as string) === 'custom') {
          return;
        }

        if (fieldConfig.type === 'date') {
          if (value) {
            try {
              const date = new Date(value as string);
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
        const value = entity[relConfig.name as keyof typeof entity];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value
            ? (value as any[]).map((item: any) => item[relConfig.primaryKey])
            : [];
        } else {
          if (relConfig.name === 'area') {
            formValues[relConfig.name] = value || null;
          } else {
            formValues[relConfig.name] = value ? (value as any)[relConfig.primaryKey] : undefined;
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
      : (addressData as any)?.content
        ? (addressData as any).content
        : (addressData as any)?.data
          ? (addressData as any).data
          : [];

    if (dataArray.length > 0) {
      form.setValue(
        'addresses',
        dataArray.map((address: any) => ({
          id: address.id,
          title: address.title ?? '',
          completeAddress: address.completeAddress ?? '',
          area: address.area || null,
          isDefault: Boolean(address.isDefault),
        })),
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
          1. Run: <code>node src/core/step-generator.js SundryCreditor</code>
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
      const backRoute = returnUrl || '/sundry-creditors';

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
        onSubmit={async () => { }}
        isSubmitting={false}
        isNew={isNew}
      />

      {/* State Management */}
      <FormStateManager entity={entity} />
    </div>
  );
}

export function SundryCreditorForm({ id }: SundryCreditorFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { mutateAsync: createEntity, isPending: isCreating } = useCreateSundryCreditor();
  const { mutateAsync: updateEntity, isPending: isUpdating } = useUpdateSundryCreditor();

  const normalizeAddressList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (data?.content) return data.content;
    if (data?.data) return data.data;
    return [];
  };

  const syncSundryCreditorAddresses = async (sundryCreditorId: number, addresses: any[], skipFetch = false) => {
    const trimmedAddresses = (addresses || [])
      .filter((address) => address?.completeAddress?.trim?.())
      .map((address) => ({
        id: address.id,
        title: address.title?.trim?.() || undefined,
        completeAddress: address.completeAddress.trim(),
        area: address.area,
        isDefault: Boolean(address.isDefault),
      }));

    if (trimmedAddresses.length === 0) {
      return;
    }

    if (skipFetch) {
      await Promise.all(
        trimmedAddresses.map((address) =>
          createSundryCreditorAddress({
            title: address.title,
            completeAddress: address.completeAddress,
            area: address.area,
            isDefault: address.isDefault,
            sundryCreditor: { id: sundryCreditorId, creditorName: '' },
          })
        )
      );
      return;
    }

    const existingResponse = await getAllSundryCreditorAddresses({
      page: 0,
      size: 1000,
      'sundryCreditorId.equals': sundryCreditorId,
    });
    const existingAddresses = normalizeAddressList(existingResponse);
    const existingIds = new Set(existingAddresses.map((address: any) => address.id));
    const incomingIds = new Set(trimmedAddresses.filter((address) => address.id).map((address) => address.id));

    const updates = trimmedAddresses
      .filter((address) => address.id && existingIds.has(address.id))
      .map((address) =>
        updateSundryCreditorAddress(address.id, {
          id: address.id,
          title: address.title,
          completeAddress: address.completeAddress,
          area: address.area,
          isDefault: address.isDefault,
          sundryCreditor: { id: sundryCreditorId, creditorName: undefined as any },
        })
      );

    const creates = trimmedAddresses
      .filter((address) => !address.id)
      .map((address) =>
        createSundryCreditorAddress({
          title: address.title,
          completeAddress: address.completeAddress,
          area: address.area,
          isDefault: address.isDefault,
          sundryCreditor: { id: sundryCreditorId, creditorName: undefined as any },
        })
      );

    const deletions = existingAddresses
      .filter((address: any) => address.id && !incomingIds.has(address.id))
      .map((address: any) => deleteSundryCreditorAddress(address.id));

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
    <SundryCreditorFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const { addresses, ...sundryCreditorData } = transformedData as any;
        const defaultAddress =
          addresses?.find((address: any) => address.isDefault)?.completeAddress ??
          addresses?.[0]?.completeAddress;
        const dataWithStatus = {
          ...sundryCreditorData,
          completeAddress: defaultAddress || undefined,
          status: 'ACTIVE',
        };

        if (isNew) {
          const created = (await createEntity(dataWithStatus)) as any;
          const createdId = created?.id;

          if (createdId) {
            await syncSundryCreditorAddresses(createdId, addresses, true);
          }

          queryClient.invalidateQueries({
            queryKey: ['getAllSundryCreditors'],
            refetchType: 'active',
          });
          queryClient.invalidateQueries({
            queryKey: ['countSundryCreditors'],
            refetchType: 'active',
          });
          queryClient.invalidateQueries({
            queryKey: ['searchSundryCreditors'],
            refetchType: 'active',
          });

          if (hasReferrer() && createdId) {
            setIsRedirecting(true);
            navigateBackToReferrer(createdId, 'SundryCreditor');
          } else {
            setIsRedirecting(true);
            sundryCreditorToast.created();
            router.push('/sundry-creditors');
          }
        } else if (id) {
          // Note: useUpdateSundryCreditor expects {id, data}
          await updateEntity({ id, data: { ...dataWithStatus, id } });
          await syncSundryCreditorAddresses(id, addresses);

          queryClient.invalidateQueries({
            queryKey: ['getAllSundryCreditors'],
            refetchType: 'active',
          });
          queryClient.invalidateQueries({
            queryKey: ['countSundryCreditors'],
            refetchType: 'active',
          });
          queryClient.invalidateQueries({
            queryKey: ['searchSundryCreditors'],
            refetchType: 'active',
          });

          setIsRedirecting(true);
          sundryCreditorToast.updated();
          router.push('/sundry-creditors');
        }
      }}
      onError={(error) => {
        handleSundryCreditorError(error);
      }}
    >
      <SundryCreditorFormContent id={id} />
    </SundryCreditorFormProvider>
  );
}
