'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, PencilLine } from 'lucide-react';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas';
import {
  ORIENTATION_FIELDS,
  mapImagesByOrientation,
} from '@/features/product-images/utils/orientation';
import { Input } from '@/components/ui/input';
import type { RenamableProductImageFile } from '@/features/product-images/types';

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

const sanitizeCustomFileName = (value: string) => value.trim().replace(/[^a-zA-Z0-9_\-]+/g, '-');

const getFileExtension = (filename?: string | null) => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot);
};

const stripExtension = (filename?: string | null) => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) {
    return filename;
  }
  return filename.slice(0, lastDot);
};

const attachCustomNameMetadata = (file: File, filename: string): RenamableProductImageFile => {
  try {
    Object.defineProperty(file, 'productCustomName', {
      value: filename,
      configurable: true,
      writable: true,
    });
  } catch {
    (file as RenamableProductImageFile).productCustomName = filename;
  }
  return file as RenamableProductImageFile;
};

function OrientationField({ form, name, label, badge, description, existingImage }: OrientationFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const watchedFile = useWatch({
    control: form.control,
    name,
  }) as RenamableProductImageFile | null | undefined;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const existingImageUrl = useMemo(() => {
    if (!existingImage) return null;
    return existingImage.thumbnailUrl || existingImage.cdnUrl || null;
  }, [existingImage]);
  const canRename = watchedFile instanceof File;
  const fileExtension = canRename ? getFileExtension(watchedFile?.name) : '';

  useEffect(() => {
    if (watchedFile && typeof window !== 'undefined' && watchedFile instanceof File) {
      const url = URL.createObjectURL(watchedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [watchedFile]);

  useEffect(() => {
    if (canRename) {
      setRenameValue(stripExtension(watchedFile?.name) || '');
    } else {
      setRenameValue('');
    }
    setIsRenaming(false);
    setRenameError(null);
  }, [canRename, watchedFile]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
    }
  }, [isRenaming]);

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
      render={({ field }) => {
        const handleRenameConfirm = () => {
          if (!canRename || !watchedFile) {
            return;
          }

          const sanitized = sanitizeCustomFileName(renameValue);

          if (!sanitized) {
            setRenameError('Please enter a valid name');
            return;
          }

          const finalName = `${sanitized}${fileExtension}`;
          const renamedFile = new File([watchedFile], finalName, {
            type: watchedFile.type,
            lastModified: watchedFile.lastModified,
          });
          const fileWithMetadata = attachCustomNameMetadata(renamedFile, finalName);

          field.onChange(fileWithMetadata);
          form.trigger(name);
          setIsRenaming(false);
        };

        const handleRenameCancel = () => {
          setIsRenaming(false);
          setRenameError(null);
          if (canRename) {
            setRenameValue(stripExtension(watchedFile?.name) || '');
          }
        };

        return (
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

                <div className="w-full space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center justify-center gap-2">
                    <span className="truncate">{helperText}</span>
                    {canRename && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          if (isRenaming) {
                            handleRenameCancel();
                          } else {
                            setRenameError(null);
                            setRenameValue(stripExtension(watchedFile?.name) || '');
                            setIsRenaming(true);
                          }
                        }}
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        <span className="sr-only">Rename image file</span>
                      </Button>
                    )}
                  </div>

                  {canRename && isRenaming && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left">
                      <p className="mb-2 text-[11px] uppercase text-slate-500">Rename file</p>
                      <div className="flex items-center gap-1">
                        <Input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(event) => {
                            setRenameValue(event.target.value);
                            if (renameError) {
                              setRenameError(null);
                            }
                          }}
                          className="h-8"
                          placeholder="New file name"
                        />
                        {fileExtension && (
                          <span className="text-xs font-mono text-muted-foreground">{fileExtension}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button type="button" size="sm" onClick={handleRenameConfirm}>
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={handleRenameCancel}>
                          Cancel
                        </Button>
                      </div>
                      {renameError && (
                        <p className="mt-2 text-[11px] font-medium text-destructive">{renameError}</p>
                      )}
                    </div>
                  )}
                </div>
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
        );
      }}
    />
  );
}
