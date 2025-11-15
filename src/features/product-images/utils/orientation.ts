'use client';

import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';

export const ORIENTATION_FIELDS = [
  {
    name: 'frontImage',
    label: 'Front Image',
    badge: 'Primary',
    description: 'Primary hero shot shown first to users.',
    subtext: 'Hero shot shown first to users.',
  },
  {
    name: 'backImage',
    label: 'Back Image',
    badge: 'Detail',
    description: 'Secondary angle that reveals product back.',
    subtext: 'Reveals the back view.',
  },
  {
    name: 'sideImage',
    label: 'Side Image',
    badge: 'Profile',
    description: 'Side profile to highlight depth and dimension.',
    subtext: 'Profile shot that captures depth.',
  },
] as const;

export type OrientationFieldName = (typeof ORIENTATION_FIELDS)[number]['name'];

export const ORIENTATION_FILENAME_SUFFIX: Record<OrientationFieldName, string> = {
  frontImage: 'front',
  backImage: 'back',
  sideImage: 'side',
};

const ORIENTATION_MATCHERS: Record<OrientationFieldName, RegExp> = {
  frontImage: /(?:^|[_\-])front(?=\.[^.]+$)/i,
  backImage: /(?:^|[_\-])back(?=\.[^.]+$)/i,
  sideImage: /(?:^|[_\-])side(?=\.[^.]+$)/i,
};

function normalizeFilename(filename?: string) {
  if (!filename) return '';
  const trimmed = filename.trim().toLowerCase();
  return trimmed;
}

export function detectOrientationFromFilename(filename?: string): OrientationFieldName | undefined {
  const normalized = normalizeFilename(filename);
  if (!normalized) {
    return undefined;
  }

  for (const [orientation, matcher] of Object.entries(ORIENTATION_MATCHERS) as [
    OrientationFieldName,
    RegExp,
  ][]) {
    if (matcher.test(normalized)) {
      return orientation;
    }
  }

  return undefined;
}

export function detectOrientationFromImage(
  image?: ProductImageDTO
): OrientationFieldName | undefined {
  if (!image) return undefined;
  return (
    detectOrientationFromFilename(image.originalFilename) ||
    detectOrientationFromFilename(image.gumletPath)
  );
}

type OrientationImageMap = Record<OrientationFieldName, ProductImageDTO | undefined>;

export function mapImagesByOrientation(images?: ProductImageDTO[]): OrientationImageMap {
  const map = {
    frontImage: undefined,
    backImage: undefined,
    sideImage: undefined,
  } as OrientationImageMap;

  if (!images?.length) {
    return map;
  }

  const remaining: ProductImageDTO[] = [];

  images.forEach((image) => {
    const orientation = detectOrientationFromImage(image);
    if (orientation && !map[orientation]) {
      map[orientation] = image;
    } else {
      remaining.push(image);
    }
  });

  if (remaining.length) {
    remaining
      .sort(
        (a, b) =>
          (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
      )
      .forEach((image) => {
        const fallbackKey = (Object.keys(map) as OrientationFieldName[]).find(
          (key) => !map[key]
        );
        if (fallbackKey) {
          map[fallbackKey] = image;
        }
      });
  }

  return map;
}
