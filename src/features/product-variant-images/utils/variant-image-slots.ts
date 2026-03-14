'use client';

import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';

export const VARIANT_IMAGE_SLOTS = [
  {
    key: 'front',
    label: 'Front Image',
    badge: 'Primary',
  },
  {
    key: 'back',
    label: 'Back Image',
    badge: 'Detail',
  },
  {
    key: 'side',
    label: 'Side Image',
    badge: 'Profile',
  },
] as const;

export type VariantImageSlot = (typeof VARIANT_IMAGE_SLOTS)[number]['key'];

export const VARIANT_IMAGE_ORDER: VariantImageSlot[] = ['front', 'back', 'side'];

export type VariantImageSlotMap<T> = Record<VariantImageSlot, T>;

export function mapVariantImagesToSlots(
  images?: ProductVariantImageDTO[]
): VariantImageSlotMap<ProductVariantImageDTO | undefined> {
  const slots: VariantImageSlotMap<ProductVariantImageDTO | undefined> = {
    front: undefined,
    back: undefined,
    side: undefined,
  };

  if (!images?.length) {
    return slots;
  }

  const sorted = [...images].sort(
    (a, b) =>
      (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
  );

  sorted.slice(0, VARIANT_IMAGE_ORDER.length).forEach((image, index) => {
    slots[VARIANT_IMAGE_ORDER[index]] = image;
  });

  return slots;
}
