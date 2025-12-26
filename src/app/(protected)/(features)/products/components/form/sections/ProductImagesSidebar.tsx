'use client';

import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Save, X, Pencil } from 'lucide-react';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import { ProductImageThumbnail } from './ProductImageThumbnail';
import {
  ORIENTATION_FIELDS,
  mapImagesByOrientation,
} from '@/features/product-images/utils/orientation';
import Link from 'next/link';

interface ProductImagesSidebarProps {
  form?: UseFormReturn<Record<string, any>>;
  existingImages?: ProductImageDTO[];
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isViewMode?: boolean;
  productId?: number;
}

export function ProductImagesSidebar({
  form,
  existingImages,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isViewMode = false,
  productId,
}: ProductImagesSidebarProps) {
  const orientationImageMap = useMemo(() => {
    return mapImagesByOrientation(existingImages);
  }, [existingImages]);

  if (isViewMode) {
    return (
      <div className="space-y-3">
        {/* Images Card */}
        <Card className="border shadow-md">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Images</h3>
                <p className="text-[10px] text-muted-foreground">Product photos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="space-y-2">
              {ORIENTATION_FIELDS.map((field) => (
                <ProductImageThumbnail
                  key={field.name}
                  form={form}
                  existingImage={orientationImageMap[field.name]}
                  name={field.name}
                  label={field.label}
                  badge={field.badge}
                  isViewMode={true}
                />
              ))}
            </div>

            <div className="rounded-md bg-slate-50 p-2 text-[10px] text-slate-600">
              <p className="font-medium text-slate-700">Guidelines</p>
              <ul className="mt-0.5 space-y-0.5 pl-3 text-[9px]">
                <li>• Max 5 MB per image</li>
                <li>• JPG, PNG, WebP</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons Card */}
        <Card className="border shadow-md">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="flex items-center gap-2 justify-center h-9">
                <Link href={`/products/${productId}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Product
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Images Card */}
      <Card className="border shadow-md">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Image className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Images</h3>
              <p className="text-[10px] text-muted-foreground">Upload photos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          <div className="space-y-2">
            {ORIENTATION_FIELDS.map((field) => (
              <ProductImageThumbnail
                key={field.name}
                form={form}
                existingImage={orientationImageMap[field.name]}
                name={field.name}
                label={field.label}
                badge={field.badge}
                isViewMode={false}
              />
            ))}
          </div>

          <div className="rounded-md bg-slate-50 p-2 text-[10px] text-slate-600">
            <p className="font-medium text-slate-700">Guidelines</p>
            <ul className="mt-0.5 space-y-0.5 pl-3 text-[9px]">
              <li>• Max 5 MB per image</li>
              <li>• JPG, PNG, WebP</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Card */}
      <Card className="border shadow-md">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 text-sm"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-9 text-sm"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
