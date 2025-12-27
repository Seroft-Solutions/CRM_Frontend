'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import type { RenamableProductImageFile } from '@/features/product-images/types';

interface ProductImageThumbnailProps {
  form?: UseFormReturn<Record<string, unknown>>;
  name: string;
  label: string;
  badge: string;
  existingImage?: ProductImageDTO;
  isViewMode?: boolean;
}

interface ProductImageThumbnailEditProps {
  form: UseFormReturn<Record<string, unknown>>;
  name: string;
  label: string;
  badge: string;
  existingImageUrl: string | null;
}

export function ProductImageThumbnail({
  form,
  name,
  label,
  badge,
  existingImage,
  isViewMode = false,
}: ProductImageThumbnailProps) {
  const existingImageUrl = useMemo(() => {
    if (!existingImage) return null;

    return existingImage.thumbnailUrl || existingImage.cdnUrl || null;
  }, [existingImage]);

  if (isViewMode) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-600">{label}</p>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wide px-1 py-0">
            {badge}
          </Badge>
        </div>

        <div className="relative w-[100px] h-[100px] overflow-hidden rounded-md border border-slate-200 bg-slate-50 flex-shrink-0">
          {existingImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={existingImageUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 h-full text-slate-400">
              <Camera className="h-6 w-6" />
              <span className="text-[9px] font-medium">No image</span>
            </div>
          )}
        </div>
        {existingImage?.originalFilename && (
          <p
            className="text-[9px] text-slate-500 max-w-[100px] truncate"
            title={existingImage.originalFilename}
          >
            {existingImage.originalFilename}
          </p>
        )}
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <ProductImageThumbnailEdit
      form={form}
      name={name}
      label={label}
      badge={badge}
      existingImageUrl={existingImageUrl}
    />
  );
}

function ProductImageThumbnailEdit({
  form,
  name,
  label,
  badge,
  existingImageUrl,
}: ProductImageThumbnailEditProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const watchedFile = useWatch({
    control: form.control,
    name,
  }) as RenamableProductImageFile | null | undefined;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (watchedFile && typeof window !== 'undefined' && watchedFile instanceof File) {
      const url = URL.createObjectURL(watchedFile);

      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [watchedFile]);

  const triggerFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <div className="flex items-center justify-between">
            <FormLabel className="text-[10px] font-semibold text-slate-600">{label}</FormLabel>
            <Badge variant="outline" className="text-[9px] uppercase tracking-wide px-1 py-0">
              {badge}
            </Badge>
          </div>

          <FormControl>
            <div className="group relative w-[100px] h-[100px] overflow-hidden rounded-md border border-slate-200 bg-slate-50 flex-shrink-0">
              {previewUrl || existingImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || existingImageUrl || ''}
                    alt={`${label} preview`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-6 text-[10px] px-2"
                      onClick={triggerFilePicker}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                    {watchedFile && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          field.onChange(null);
                          if (inputRef.current) {
                            inputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-[9px] font-medium">Upload</span>
                </button>
              )}
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

          {watchedFile instanceof File && (
            <p
              className="truncate text-[9px] text-slate-500 max-w-[100px]"
              title={watchedFile.name}
            >
              {watchedFile.name}
            </p>
          )}
        </FormItem>
      )}
    />
  );
}
