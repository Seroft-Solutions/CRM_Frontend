'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import {
  ORIENTATION_FIELDS,
  mapImagesByOrientation,
} from '@/features/product-images/utils/orientation';

interface ProductImagesStepProps {
  form: UseFormReturn<Record<string, any>>;
  existingImages?: ProductImageDTO[];
}

export function ProductImagesStep({ form, existingImages }: ProductImagesStepProps) {
  const orientationImageMap = useMemo(() => {
    return mapImagesByOrientation(existingImages);
  }, [existingImages]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Orientation guidelines</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Upload up to three images so the catalog shows every angle.</li>
          <li>Supported formats: JPG, PNG, WebP · Max size: 5 MB per file.</li>
          <li>Front image becomes the default thumbnail for your product.</li>
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ORIENTATION_FIELDS.map((field) => (
          <OrientationField
            key={field.name}
            form={form}
            existingImage={orientationImageMap[field.name]}
            {...field}
          />
        ))}
      </div>
    </div>
  );
}

interface OrientationFieldProps {
  form: UseFormReturn<Record<string, any>>;
  name: (typeof ORIENTATION_FIELDS)[number]['name'];
  label: string;
  badge: string;
  description: string;
  existingImage?: ProductImageDTO;
}

function OrientationField({ form, name, label, badge, description, existingImage }: OrientationFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const watchedFile = useWatch({
    control: form.control,
    name,
  }) as File | null | undefined;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const existingImageUrl = useMemo(() => {
    if (!existingImage) return null;
    return existingImage.thumbnailUrl || existingImage.cdnUrl || null;
  }, [existingImage]);

  useEffect(() => {
    if (watchedFile && typeof window !== 'undefined' && watchedFile instanceof File) {
      const url = URL.createObjectURL(watchedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [watchedFile]);

  const helperText = useMemo(() => {
    if (!watchedFile) {
      if (existingImage?.originalFilename) {
        return `${existingImage.originalFilename} • already uploaded`;
      }
      return 'Select an image to represent this orientation.';
    }
    if (watchedFile instanceof File) {
      const sizeInMb = (watchedFile.size / (1024 * 1024)).toFixed(2);
      return `${watchedFile.name} • ${sizeInMb} MB`;
    }
    return '';
  }, [watchedFile]);

  const triggerFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-semibold text-slate-800">{label}</FormLabel>
            <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
              {badge}
            </Badge>
          </div>

          <FormControl>
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {previewUrl || existingImageUrl ? (
                    <img
                      src={previewUrl || existingImageUrl || ''}
                      alt={`${label} preview`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Camera className="h-10 w-10" />
                      <span className="text-sm font-medium">Drop or upload image</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">{description}</p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="px-4"
                    variant="default"
                    onClick={triggerFilePicker}
                  >
                    {watchedFile || existingImage ? 'Replace Image' : 'Upload Image'}
                  </Button>
                  {watchedFile && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        field.onChange(null);
                        if (inputRef.current) {
                          inputRef.current.value = '';
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-600">{helperText}</p>
              </div>
            </div>
          </FormControl>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              field.onChange(file ?? null);
              form.trigger(name);
            }}
          />

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
