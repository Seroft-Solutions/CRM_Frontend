'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductFormProvider, useEntityForm } from './product-form-provider';
import { FormProgressIndicator } from './form-progress-indicator';
import { FormStepRenderer } from './form-step-renderer';
import { FormNavigation } from './form-navigation';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

import {
  useCreateProduct,
  useGetProduct,
  useUpdateProduct,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { handleProductError, productToast } from '../product-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadImages, useDeleteImage, useHardDeleteImage } from '@/features/product-images';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { toast } from 'sonner';

interface ProductFormProps {
  id?: number;
}

const ORIENTATION_UPLOAD_SEQUENCE = ['frontImage', 'backImage', 'sideImage'] as const;

function ProductFormContent({ id, onEntityData }: { id?: number; onEntityData?: (entity: any) => void }) {
  const router = useRouter();
  const isNew = !id;
  const { state, actions, form, navigation, config } = useEntityForm();
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();

  const { data: entity, isLoading: isLoadingEntity } = useGetProduct(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ['get-product', id],
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

    // Pass entity data up to parent
    if (entity && onEntityData) {
      onEntityData(entity);
    }
  }, [entity, config, form, state.isLoading, onEntityData]);

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
          1. Run: <code>node src/core/step-generator.js Product</code>
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
      const backRoute = returnUrl || '/products';

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
        onSubmit={async () => {}}
        isSubmitting={state.isSubmitting}
        isNew={isNew}
      />

      {/* State Management */}
      <FormStateManager entity={entity} />
    </div>
  );
}

export function ProductForm({ id }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = !id;
  const { navigateBackToReferrer, hasReferrer } = useCrossFormNavigation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const uploadImagesMutation = useUploadImages();
  const { organizationId } = useOrganizationContext();
  const [existingEntity, setExistingEntity] = useState<any>(null);

  const resolvedOrganizationId = useMemo(() => {
    const parsed = Number(organizationId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [organizationId]);

  const invalidateProductQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['getAllProducts'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['countProducts'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['searchProducts'], refetchType: 'active' }),
      // Also invalidate the specific product query if we have an ID
      ...(id ? [queryClient.invalidateQueries({ queryKey: ['get-product', id], refetchType: 'active' })] : []),
    ]);
  }, [queryClient, id]);

  const handlePostCreateNavigation = useCallback(
    (entityId?: number) => {
      if (hasReferrer() && entityId) {
        setIsRedirecting(true);
        navigateBackToReferrer(entityId, 'Product');
      } else {
        setIsRedirecting(true);
        productToast.created();
        router.push('/products');
      }
    },
    [hasReferrer, navigateBackToReferrer, router]
  );

  const handlePostUpdateNavigation = useCallback(() => {
    setIsRedirecting(true);
    productToast.updated();
    router.push('/products');
  }, [router]);

  const handleImageUploads = useCallback(
    async (productId: number | undefined, attachments: Record<string, File | null | undefined>, existingImages?: ProductImageDTO[]) => {
      if (!productId) return;

      const filesToUpload: File[] = [];
      const imagesToDelete: ProductImageDTO[] = [];

      // Check each orientation for new files
      ORIENTATION_UPLOAD_SEQUENCE.forEach((orientationKey) => {
        const newFile = attachments[orientationKey];

        // If there's a new file for this orientation
        if (newFile && newFile instanceof File) {
          filesToUpload.push(newFile);
        }
      });

      // If we're uploading new files, delete ALL existing images
      // This ensures complete replacement of all product images
      if (filesToUpload.length > 0 && existingImages && existingImages.length > 0) {
        imagesToDelete.push(...existingImages);
      }

      // If no new files were uploaded but we have existing images, check for explicit removals
      if (filesToUpload.length === 0 && existingImages && existingImages.length > 0) {
        // Check if any orientation fields have null/undefined values (indicating removal)
        const hasAnyRemovals = ORIENTATION_UPLOAD_SEQUENCE.some((orientationKey) => {
          return attachments[orientationKey] === null || attachments[orientationKey] === undefined;
        });

        if (hasAnyRemovals) {
          // Mark all existing images for deletion
          imagesToDelete.push(...existingImages);
        }
      }

      // Delete old images first
      if (imagesToDelete.length > 0) {
        const deleteImageMutation = useHardDeleteImage();
        for (const imageToDelete of imagesToDelete) {
          if (!imageToDelete.id) continue;
          try {
            await deleteImageMutation.mutateAsync(imageToDelete.id);
            toast.success(`Old ${imageToDelete.originalFilename || 'image'} deleted`, {
              description: 'Replaced with new image.',
            });
          } catch (error) {
            console.error('Failed to delete old image:', error);
            toast.error('Failed to delete old image', {
              description: 'New image was still uploaded.',
            });
          }
        }
      }

      // Upload new images
      if (filesToUpload.length > 0) {
        try {
          await uploadImagesMutation.mutateAsync({
            productId,
            files: filesToUpload,
          });
          toast.success('Product images uploaded', {
            description: `${filesToUpload.length} image${filesToUpload.length > 1 ? 's' : ''} ready.`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to upload product images.';
          toast.error('Image upload failed', { description: message });
        }
      }
    },
    [uploadImagesMutation]
  );

  const { mutateAsync: createProductAsync } = useCreateProduct({
    mutation: {
      onError: (error) => {
        handleProductError(error);
      },
    },
  });

  const { mutateAsync: updateProductAsync } = useUpdateProduct({
    mutation: {
      onError: (error) => {
        handleProductError(error);
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
    <ProductFormProvider
      id={id}
      onSuccess={async ({ entity, attachments }) => {
        const productData = entity as Record<string, any>;
        const productDataWithStatus = {
          ...productData,
          status: 'ACTIVE',
        };

        if (isNew) {
          try {
            const createdProduct = await createProductAsync({
              data: productDataWithStatus as any,
            });
            await handleImageUploads(createdProduct?.id, attachments);
            await invalidateProductQueries();
            handlePostCreateNavigation(createdProduct?.id);
          } catch {
            // Error already handled via mutation onError
          }
        } else if (id) {
          try {
            const entityData = { ...productDataWithStatus, id };
            await updateProductAsync({ id, data: entityData as any });
            await handleImageUploads(id, attachments, existingEntity?.images);
            await invalidateProductQueries();
            handlePostUpdateNavigation();
          } catch {
            // Error already handled via mutation onError
          }
        }
      }}
      onError={(error) => {
        handleProductError(error);
      }}
    >
      <ProductFormContent id={id} onEntityData={setExistingEntity} />
    </ProductFormProvider>
  );
}
