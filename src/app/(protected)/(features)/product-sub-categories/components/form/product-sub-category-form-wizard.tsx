'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProductSubCategoryFormProvider,
  useEntityForm,
} from './product-sub-category-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import {
  useCreateProductSubCategory,
  useGetProductSubCategory,
  useUpdateProductSubCategory,
} from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import {
  handleProductSubCategoryError,
  productSubCategoryToast,
} from '../product-sub-category-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';

interface ProductSubCategoryFormProps {
  id?: number;
}

function ProductSubCategoryFormContent({ id }: ProductSubCategoryFormProps) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetProductSubCategory(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-product-sub-category', id],
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
          1. Run: <code>node src/core/step-generator.js ProductSubCategory</code>
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
      const backRoute = returnUrl || '/product-sub-categories';

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
          'name': '',
          'code': '',
          'description': '',
          'remark': '',
          'status': '',
          'category': 'Category',
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

export function ProductSubCategoryForm({ id }: ProductSubCategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { mutate: createEntity, isPending: isCreating } = useCreateProductSubCategory({
    mutation: {
      onSuccess: (data) => {
        const entityId = data?.id || data?.id;

        queryClient.invalidateQueries({
          queryKey: ['getAllProductSubCategories'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countProductSubCategories'],
          refetchType: 'active',
        });

        queryClient.invalidateQueries({
          queryKey: ['searchProductSubCategories'],
          refetchType: 'active',
        });

        if (hasReferrer() && entityId) {
          setIsRedirecting(true);
          navigateBackToReferrer(entityId, 'ProductSubCategory');
        } else {
          setIsRedirecting(true);
          productSubCategoryToast.created();
          router.push('/product-sub-categories');
        }
      },
      onError: (error) => {
        handleProductSubCategoryError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateProductSubCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['getAllProductSubCategories'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countProductSubCategories'],
          refetchType: 'active',
        });

        queryClient.invalidateQueries({
          queryKey: ['searchProductSubCategories'],
          refetchType: 'active',
        });

        setIsRedirecting(true);
        productSubCategoryToast.updated();
        router.push('/product-sub-categories');
      },
      onError: (error) => {
        handleProductSubCategoryError(error);
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
    <ProductSubCategoryFormProvider
      id={id}
      onSuccess={async (transformedData) => {
        const { ...productSubCategoryData } = transformedData as any;
        const productSubCategoryDataWithStatus = {
          ...productSubCategoryData,
          status: 'ACTIVE',
        };

        if (isNew) {
          createEntity({ data: productSubCategoryDataWithStatus as any });
        } else if (id) {
          const entityData = { ...productSubCategoryDataWithStatus, id };
          updateEntity({ id, data: entityData as any });
        }
      }}
      onError={(error) => {
        handleProductSubCategoryError(error);
      }}
    >
      <ProductSubCategoryFormContent id={id} />
    </ProductSubCategoryFormProvider>
  );
}
