'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductFormProvider, useEntityForm } from './product-form-provider';
import { FormStateManager } from './form-state-manager';
import { Form } from '@/components/ui/form';
import { ProductFormSinglePage } from './product-form-single-page';
import { Card, CardContent } from '@/components/ui/card';

import {
  useCreateProduct,
  useGetProduct,
  useUpdateProduct,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  useCreateProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  useCreateProductVariantSelection,
} from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { handleProductError, productToast } from '../product-toast';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUploadImages,
  useHardDeleteImage,
  useReorderImages,
} from '@/features/product-images';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { toast } from 'sonner';
import {
  ORIENTATION_FILENAME_SUFFIX,
  mapImagesByOrientation,
  detectOrientationFromImage,
  type OrientationFieldName,
} from '@/features/product-images/utils/orientation';
import type { RenamableProductImageFile } from '@/features/product-images/types';

interface ProductFormProps {
  id?: number;
}

const ORIENTATION_UPLOAD_SEQUENCE: OrientationFieldName[] = [
  'frontImage',
  'backImage',
  'sideImage',
];
const PRODUCT_IMAGE_MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const fallbackBaseName = (productId?: number) => `product-${productId ?? 'image'}`;

const sanitizeProductNameForFile = (productName?: string, productId?: number) => {
  if (!productName) {
    return fallbackBaseName(productId);
  }

  const sanitized = productName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return sanitized || fallbackBaseName(productId);
};

const resolveFileExtension = (file: File) => {
  const nameMatch = file.name.match(/(\.[^.]+)$/);
  if (nameMatch?.[1]) {
    return nameMatch[1].toLowerCase();
  }
  return PRODUCT_IMAGE_MIME_EXTENSION_MAP[file.type] ?? '';
};

const renameImageFileForOrientation = (
  file: File,
  orientationKey: (typeof ORIENTATION_UPLOAD_SEQUENCE)[number],
  productName?: string,
  productId?: number
) => {
  if (typeof File === 'undefined') {
    return file;
  }

  const fileWithCustomName = file as RenamableProductImageFile;
  if (fileWithCustomName?.productCustomName) {
    return fileWithCustomName;
  }

  const extension = resolveFileExtension(file);
  const baseName = sanitizeProductNameForFile(productName, productId);
  const suffix = ORIENTATION_FILENAME_SUFFIX[orientationKey];
  const renamedFile = `${baseName}_${suffix}${extension}`;

  return new File([file], renamedFile, {
    type: file.type,
    lastModified: file.lastModified,
  });
};

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
    if (entity && !state.isLoading) {
      const formValues: Record<string, any> = {};

      config.fields.forEach((fieldConfig) => {
        const value = (entity as any)[fieldConfig.name];

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
        const value = (entity as any)[relConfig.name];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value
            ? value.map((item: any) => item[relConfig.primaryKey])
            : [];
        } else {
          formValues[relConfig.name] = value ? value[relConfig.primaryKey] : undefined;
        }
      });

      // Don't reset variants field if it already exists (set by ProductVariantManager)
      const currentVariants = form.getValues('variants');
      if (currentVariants && currentVariants.length > 0) {
        formValues.variants = currentVariants;
      }

      form.reset(formValues);
    }

    // Pass entity data up to parent
    if (entity && onEntityData) {
      onEntityData(entity);
    }
  }, [entity, config, form, state.isLoading, onEntityData]);

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
        <div className="bg-card p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Auto-population loading overlay */}
      {state.isAutoPopulating && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Setting up your form...</p>
          </div>
        </div>
      )}

      {/* Single-Page Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(actions.submitForm)}>
          <ProductFormSinglePage
            form={form}
            config={config}
            actions={actions}
            entity={entity}
            existingImages={entity?.images}
            onSubmit={actions.submitForm}
            onCancel={handleCancel}
            isSubmitting={state.isSubmitting}
            productId={id}
          />
        </form>
      </Form>

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
  const hardDeleteImageMutation = useHardDeleteImage();
  const reorderImagesMutation = useReorderImages();
  const { organizationId } = useOrganizationContext();
  const [existingEntity, setExistingEntity] = useState<any>(null);

  // Get mutation functions at component level to avoid hook calls in async callbacks
  const createVariantMutation = useCreateProductVariant();
  const createSelectionMutation = useCreateProductVariantSelection();

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

  const handleVariantsCreation = useCallback(
    async (productId: number | undefined, variants: any[]) => {
      if (!productId || !variants.length) {
        return;
      }

      for (const variantData of variants) {
        try {
          // Create the variant
          const variantPayload = {
            sku: variantData.sku,
            price: variantData.price,
            stockQuantity: variantData.stockQuantity,
            status: variantData.status,
            product: { id: productId },
          };

          const createdVariant = await createVariantMutation.mutateAsync({
            data: variantPayload,
          });

          // Create variant selections
          if (variantData.selections && Array.isArray(variantData.selections)) {
            for (const selection of variantData.selections) {
              const selectionPayload = {
                status: selection.status,
                attribute: selection.attribute,
                option: selection.option,
                variant: { id: createdVariant.id },
              };

              await createSelectionMutation.mutateAsync({
                data: selectionPayload,
              });
            }
          }
        } catch (error) {
          console.error('Failed to create variant:', error);
          toast.error('Failed to create some variants', {
            description: 'The product was created but some variants could not be saved.',
          });
        }
      }
    },
    [createVariantMutation, createSelectionMutation]
  );

  const handleImageUploads = useCallback(
    async (
      productId: number | undefined,
      attachments: Record<string, File | null | undefined>,
      existingImages?: ProductImageDTO[],
      productName?: string
    ) => {
      if (!productId) return;

      const existingOrientationMap = mapImagesByOrientation(existingImages);
      const filesToUpload: { orientation: OrientationFieldName; file: File }[] = [];
      const imagesToDelete: ProductImageDTO[] = [];
      const finalOrientationState: Record<OrientationFieldName, ProductImageDTO | null> = {
        frontImage: existingOrientationMap.frontImage ?? null,
        backImage: existingOrientationMap.backImage ?? null,
        sideImage: existingOrientationMap.sideImage ?? null,
      };

      ORIENTATION_UPLOAD_SEQUENCE.forEach((orientationKey) => {
        const newValue = attachments[orientationKey];

        if (newValue instanceof File) {
          const renamedFile = renameImageFileForOrientation(
            newValue,
            orientationKey,
            productName,
            productId
          );
          filesToUpload.push({ orientation: orientationKey, file: renamedFile });
          if (existingOrientationMap[orientationKey]) {
            imagesToDelete.push(existingOrientationMap[orientationKey]!);
          }
          finalOrientationState[orientationKey] = null;
        } else if (newValue === null) {
          if (existingOrientationMap[orientationKey]) {
            imagesToDelete.push(existingOrientationMap[orientationKey]!);
          }
          finalOrientationState[orientationKey] = null;
        }
      });

      const uniqueImagesToDelete = Array.from(
        new Map(
          imagesToDelete
            .filter((image): image is ProductImageDTO & { id: number } => Boolean(image?.id))
            .map((image) => [image.id!, image])
        ).values()
      );

      if (uniqueImagesToDelete.length > 0) {
        for (const imageToDelete of uniqueImagesToDelete) {
          try {
            await hardDeleteImageMutation.mutateAsync(imageToDelete.id!);
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

      let createdImages: ProductImageDTO[] = [];

      if (filesToUpload.length > 0) {
        try {
          const uploadResult = (await uploadImagesMutation.mutateAsync({
            productId,
            files: filesToUpload.map(({ file }) => file),
          })) as unknown;

          const normalizedResult = Array.isArray(uploadResult)
            ? uploadResult
            : uploadResult
              ? [uploadResult]
              : [];

          createdImages = normalizedResult as ProductImageDTO[];

          toast.success('Product images uploaded', {
            description: `${filesToUpload.length} image${filesToUpload.length > 1 ? 's' : ''} ready.`,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to upload product images.';
          toast.error('Image upload failed', { description: message });
          return;
        }
      }

      if (createdImages.length > 0) {
        const pendingOrientations = new Set(
          filesToUpload.map((entry) => entry.orientation) as OrientationFieldName[]
        );

        createdImages.forEach((image) => {
          const detected = detectOrientationFromImage(image);
          if (detected && pendingOrientations.has(detected)) {
            finalOrientationState[detected] = image;
            pendingOrientations.delete(detected);
            return;
          }

          const fallback = pendingOrientations.values().next().value as
            | OrientationFieldName
            | undefined;
          if (fallback) {
            finalOrientationState[fallback] = image;
            pendingOrientations.delete(fallback);
          }
        });
      }

      const shouldReorder =
        uniqueImagesToDelete.length > 0 ||
        filesToUpload.length > 0 ||
        Boolean(existingImages?.length);

      if (shouldReorder) {
        const desiredOrderIds = ORIENTATION_UPLOAD_SEQUENCE.map(
          (orientationKey) => finalOrientationState[orientationKey]?.id
        ).filter((id): id is number => typeof id === 'number');

        if (desiredOrderIds.length > 0) {
          try {
            await reorderImagesMutation.mutateAsync({
              productId,
              imageIds: desiredOrderIds,
            });
          } catch (error) {
            console.error('Failed to reorder product images:', error);
            toast.error('Unable to reorder product images', {
              description: 'Images were uploaded but display order may be incorrect.',
            });
          }
        }
      }
    },
    [hardDeleteImageMutation, reorderImagesMutation, uploadImagesMutation]
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

        // Extract variants from product data before sending to create/update
        const { variants: productVariants, ...productDataWithoutVariants } = productData;

        const productDataWithStatus = {
          ...productDataWithoutVariants,
          status: 'ACTIVE',
        };

        if (isNew) {
          try {
            const createdProduct = await createProductAsync({
              data: productDataWithStatus as any,
            });
            await handleImageUploads(
              createdProduct?.id,
              attachments,
              undefined,
              createdProduct?.name ?? productDataWithStatus.name
            );
            // Handle variants creation after product is created
            if (productVariants && Array.isArray(productVariants) && productVariants.length > 0) {
              await handleVariantsCreation(createdProduct?.id, productVariants);
            }
            await invalidateProductQueries();
            // Invalidate variant queries
            await queryClient.invalidateQueries({ queryKey: ['getAllProductVariants'], refetchType: 'active' });
            handlePostCreateNavigation(createdProduct?.id);
          } catch {
            // Error already handled via mutation onError
          }
        } else if (id) {
          try {
            const entityData = { ...productDataWithStatus, id };
            await updateProductAsync({ id, data: entityData as any });
            await handleImageUploads(
              id,
              attachments,
              existingEntity?.images,
              entityData.name ?? existingEntity?.name
            );
            // Handle variants creation for edit mode (newly generated variants)
            if (productVariants && Array.isArray(productVariants) && productVariants.length > 0) {
              await handleVariantsCreation(id, productVariants);
            }
            await invalidateProductQueries();
            // Invalidate variant queries
            await queryClient.invalidateQueries({ queryKey: ['getAllProductVariants'], refetchType: 'active' });
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
