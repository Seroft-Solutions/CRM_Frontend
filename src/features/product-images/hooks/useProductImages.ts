'use client';

/**
 * Product Images Hooks
 *
 * This file provides simplified wrappers around the auto-generated OpenAPI hooks
 * from @/core/api/generated/spring/endpoints/product-image-resource/product-image-resource.gen.ts
 *
 * These wrappers maintain a clean, consistent API while ensuring we use the generated
 * clients as required by the project's API-First Development principle.
 */

import {
  type UploadProductImageMutationResult,
  type UploadProductImagesMutationResult,
  useCountProductImages,
  useDeleteProductImage,
  useGetAllProductImagesByProduct,
  useReorderProductImages,
  useUploadProductImage,
  useUploadProductImages,
} from '@/core/api/generated/spring/endpoints/product-image-resource/product-image-resource.gen';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';

export type { ProductImageDTO };

/**
 * Fetch all images for a product
 * Wrapper around useGetAllProductImagesByProduct
 */
export function useProductImages(productId: number) {
  return useGetAllProductImagesByProduct(productId, {
    query: {
      enabled: !!productId,
    },
  });
}

/**
 * Upload a single image
 * Wrapper around useUploadProductImage with simplified API
 *
 * Usage:
 * const upload = useUploadImage();
 * await upload.mutateAsync({ productId, organizationId, file });
 */
export function useUploadImage() {
  const mutation = useUploadProductImage();

  return {
    ...mutation,
    mutateAsync: async ({
      productId,
      organizationId,
      file,
    }: {
      productId: number;
      organizationId: number;
      file: File;
    }): Promise<UploadProductImageMutationResult> => {
      return mutation.mutateAsync({
        data: { file },
        params: { productId, organizationId },
      });
    },
    mutate: (variables: { productId: number; organizationId: number; file: File }) => {
      mutation.mutate({
        data: { file: variables.file },
        params: { productId: variables.productId, organizationId: variables.organizationId },
      });
    },
  };
}

/**
 * Upload multiple images (batch)
 * Wrapper around useUploadProductImages with simplified API
 *
 * Usage:
 * const upload = useUploadImages();
 * await upload.mutateAsync({ productId, organizationId, files });
 */
export function useUploadImages() {
  const mutation = useUploadProductImages();

  return {
    ...mutation,
    mutateAsync: async ({
      productId,
      organizationId,
      files,
    }: {
      productId: number;
      organizationId: number;
      files: File[];
    }): Promise<UploadProductImagesMutationResult> => {
      return mutation.mutateAsync({
        data: { files },
        params: { productId, organizationId },
      });
    },
    mutate: (variables: { productId: number; organizationId: number; files: File[] }) => {
      mutation.mutate({
        data: { files: variables.files },
        params: { productId: variables.productId, organizationId: variables.organizationId },
      });
    },
  };
}

/**
 * Delete an image (soft delete)
 * Wrapper around useDeleteProductImage with simplified API
 *
 * Usage:
 * const deleteImage = useDeleteImage();
 * await deleteImage.mutateAsync(imageId);
 */
export function useDeleteImage() {
  const mutation = useDeleteProductImage();

  return {
    ...mutation,
    mutateAsync: async (imageId: number): Promise<void> => {
      return mutation.mutateAsync({ id: imageId });
    },
    mutate: (imageId: number) => {
      mutation.mutate({ id: imageId });
    },
  };
}

/**
 * Reorder images
 * Wrapper around useReorderProductImages with simplified API
 *
 * Usage:
 * const reorder = useReorderImages();
 * await reorder.mutateAsync({ productId, imageIds });
 */
export function useReorderImages() {
  const mutation = useReorderProductImages();

  return {
    ...mutation,
    mutateAsync: async ({
      productId,
      imageIds,
    }: {
      productId: number;
      imageIds: number[];
    }): Promise<void> => {
      return mutation.mutateAsync({
        productId,
        data: imageIds,
      });
    },
    mutate: (variables: { productId: number; imageIds: number[] }) => {
      mutation.mutate({
        productId: variables.productId,
        data: variables.imageIds,
      });
    },
  };
}

/**
 * Get image count for a product
 * Wrapper around useCountProductImages
 */
export function useProductImageCount(productId: number) {
  return useCountProductImages(productId, {
    query: {
      enabled: !!productId,
    },
  });
}
