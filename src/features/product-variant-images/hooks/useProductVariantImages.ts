'use client';

import { useMutation } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export function useHardDeleteVariantImage() {
  return useMutation({
    mutationFn: async (imageId: number): Promise<void> => {
      await springServiceMutator<void>({
        url: `/api/product-variant-images/${imageId}/hard`,
        method: 'DELETE',
      });
    },
  });
}

export function useReorderVariantImages() {
  return useMutation({
    mutationFn: async ({
      variantId,
      imageIds,
    }: {
      variantId: number;
      imageIds: number[];
    }): Promise<void> => {
      await springServiceMutator<void>({
        url: `/api/product-variant-images/variant/${variantId}/reorder`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: imageIds,
      });
    },
  });
}
