'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Pencil, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';
import { useUploadProductVariantImage } from '@/core/api/generated/spring';
import { getGetAllProductVariantImagesByVariantQueryKey } from '@/core/api/generated/spring/endpoints/product-variant-images/product-variant-images.gen';
import {
  mapVariantImagesToSlots,
  VARIANT_IMAGE_ORDER,
  VARIANT_IMAGE_SLOTS,
  type VariantImageSlotMap,
} from '@/features/product-variant-images/utils/variant-image-slots';
import {
  useHardDeleteVariantImage,
  useReorderVariantImages,
} from '@/features/product-variant-images/hooks/useProductVariantImages';

type VariantImageSlotState = {
  existing: ProductVariantImageDTO | null;
  file: File | null;
  name: string;
};

type VariantImageSlotStateMap = VariantImageSlotMap<VariantImageSlotState>;

interface VariantImagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId?: number;
  variantLabel: string;
  productName?: string;
  existingImages?: ProductVariantImageDTO[];
  initialFiles?: VariantImageSlotMap<File | null>;
  onSaveDraft?: (files: VariantImageSlotMap<File | null>) => void;
}

const emptySlotFiles: VariantImageSlotMap<File | null> = {
  front: null,
  back: null,
  side: null,
};

const VARIANT_IMAGE_MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const normalizeNamePart = (value?: string, fallback = 'image') => {
  const normalized = (value ?? '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
};

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, '');

const resolveFileExtension = (file: File) => {
  const nameMatch = file.name.match(/(\.[^.]+)$/);

  if (nameMatch?.[1]) {
    return nameMatch[1].toLowerCase();
  }

  return VARIANT_IMAGE_MIME_EXTENSION_MAP[file.type] ?? '';
};

const renameVariantImageFile = (file: File, baseName: string) => {
  if (typeof File === 'undefined') {
    return file;
  }

  const extension = resolveFileExtension(file);
  const finalBase = normalizeNamePart(stripExtension(baseName || ''));
  const finalName = `${finalBase}${extension}`;

  return new File([file], finalName, {
    type: file.type,
    lastModified: file.lastModified,
  });
};

export function VariantImagesSheet({
  open,
  onOpenChange,
  variantId,
  variantLabel,
  productName,
  existingImages,
  initialFiles,
  onSaveDraft,
}: VariantImagesSheetProps) {
  const queryClient = useQueryClient();
  const uploadImageMutation = useUploadProductVariantImage();
  const deleteImageMutation = useHardDeleteVariantImage();
  const reorderImagesMutation = useReorderVariantImages();
  const [isSaving, setIsSaving] = useState(false);
  const variantNamePart = useMemo(
    () => normalizeNamePart(variantLabel || productName, 'variant'),
    [variantLabel, productName]
  );
  const defaultNameBySlot = useMemo(() => {
    return VARIANT_IMAGE_ORDER.reduce((acc, slot) => {
      const slotPrefix =
        slot === 'front' ? 'Front' : slot === 'back' ? 'Back' : slot === 'side' ? 'Side' : 'Image';
      acc[slot] = `${slotPrefix}_${variantNamePart}`;
      return acc;
    }, {} as VariantImageSlotMap<string>);
  }, [variantNamePart]);

  const initialSlotState = useMemo<VariantImageSlotStateMap>(() => {
    const mappedExisting = mapVariantImagesToSlots(existingImages);

    return VARIANT_IMAGE_ORDER.reduce((acc, slot) => {
      const initialFile = initialFiles?.[slot] ?? null;
      const initialName = initialFile
        ? stripExtension(initialFile.name)
        : defaultNameBySlot[slot];
      acc[slot] = {
        existing: mappedExisting[slot] ?? null,
        file: initialFile,
        name: initialName,
      };
      return acc;
    }, {} as VariantImageSlotStateMap);
  }, [existingImages, initialFiles, defaultNameBySlot]);

  const [slotState, setSlotState] = useState<VariantImageSlotStateMap>(initialSlotState);

  useEffect(() => {
    if (open) {
      setSlotState(initialSlotState);
    }
  }, [open, initialSlotState]);

  const handleSave = async () => {
    if (!variantId) {
      const filesToSave = VARIANT_IMAGE_ORDER.reduce((acc, slot) => {
        const file = slotState[slot].file;
        const desiredName = slotState[slot].name || defaultNameBySlot[slot];
        acc[slot] = file ? renameVariantImageFile(file, desiredName) : null;
        return acc;
      }, {} as VariantImageSlotMap<File | null>);

      onSaveDraft?.(filesToSave);
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const uploadsBySlot: VariantImageSlotMap<ProductVariantImageDTO | undefined> = {
        front: undefined,
        back: undefined,
        side: undefined,
      };
      const deleteQueue: ProductVariantImageDTO[] = [];

      VARIANT_IMAGE_ORDER.forEach((slot) => {
        const { existing, file } = slotState[slot];

        if (existing && file) {
          deleteQueue.push(existing);
        }
      });

      for (const image of deleteQueue) {
        if (image.id) {
          await deleteImageMutation.mutateAsync(image.id);
        }
      }

      for (const slot of VARIANT_IMAGE_ORDER) {
        const { file } = slotState[slot];

        if (!file) continue;

        const renamedFile = renameVariantImageFile(
          file,
          slotState[slot].name || defaultNameBySlot[slot]
        );
        const uploaded = await uploadImageMutation.mutateAsync({
          data: { file: renamedFile },
          params: { variantId },
        });
        uploadsBySlot[slot] = uploaded;
      }

      const finalImages = VARIANT_IMAGE_ORDER.map((slot) => {
        const { existing } = slotState[slot];
        return uploadsBySlot[slot] ?? existing ?? undefined;
      }).filter((image): image is ProductVariantImageDTO => Boolean(image));

      const reorderIds = finalImages.map((image) => image.id!).filter(
        (id) => typeof id === 'number'
      );

      if (reorderIds.length > 0) {
        await reorderImagesMutation.mutateAsync({ variantId, imageIds: reorderIds });
      }

      await queryClient.invalidateQueries({
        queryKey: getGetAllProductVariantImagesByVariantQueryKey(variantId),
      });

      toast.success('Variant images updated.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update variant images.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white p-0">
        <div className="border-b bg-slate-50 px-6 py-5">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold text-slate-900">
              Variant Images
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-600">
              Upload front, back, and side images for {variantLabel}.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {VARIANT_IMAGE_SLOTS.map((slot) => (
              <VariantImageSlotCard
                key={slot.key}
                label={slot.label}
                badge={slot.badge}
                state={slotState[slot.key]}
                onFileChange={(file) =>
                  setSlotState((prev) => ({
                    ...prev,
                    [slot.key]: {
                      existing: prev[slot.key].existing,
                      file,
                      name: file
                        ? prev[slot.key].name || defaultNameBySlot[slot.key]
                        : defaultNameBySlot[slot.key],
                    },
                  }))
                }
                onNameChange={(name) =>
                  setSlotState((prev) => ({
                    ...prev,
                    [slot.key]: {
                      ...prev[slot.key],
                      name,
                    },
                  }))
                }
                onClear={() =>
                  setSlotState((prev) => ({
                    ...prev,
                    [slot.key]: {
                      existing: null,
                      file: null,
                      name: defaultNameBySlot[slot.key],
                    },
                  }))
                }
                defaultName={defaultNameBySlot[slot.key]}
              />
            ))}
          </div>

          <div className="rounded-md bg-slate-50 p-3 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-700">Guidelines</p>
            <ul className="mt-1 space-y-1">
              <li>• Front, Back, Side image slots</li>
              <li>• Max 5 MB per image</li>
              <li>• JPG, PNG, WebP</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="border-t bg-white px-6 py-4">
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface VariantImageSlotCardProps {
  label: string;
  badge: string;
  state: VariantImageSlotState;
  onFileChange: (file: File | null) => void;
  onNameChange: (name: string) => void;
  onClear: () => void;
  defaultName: string;
}

function VariantImageSlotCard({
  label,
  badge,
  state,
  onFileChange,
  onNameChange,
  onClear,
  defaultName,
}: VariantImageSlotCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (state.file) {
      const url = URL.createObjectURL(state.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [state.file]);

  useEffect(() => {
    if (!state.file) {
      setIsEditingName(false);
    }
  }, [state.file]);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  const imageUrl =
    previewUrl || state.existing?.thumbnailUrl || state.existing?.cdnUrl || null;
  const extension = state.file ? resolveFileExtension(state.file) : '';
  const displayName = state.file ? `${state.name || defaultName}${extension}` : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wide px-1 py-0">
          {badge}
        </Badge>
      </div>
      <div className="group relative h-[110px] w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-[10px]"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-[10px]"
                onClick={onClear}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Camera className="h-6 w-6" />
            <span className="text-[10px] font-medium">Upload</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onFileChange(file);
          if (file) {
            onNameChange(defaultName);
          }
        }}
      />
      {state.file && (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500">Image name</label>
          {isEditingName ? (
            <Input
              ref={nameInputRef}
              value={state.name || ''}
              onChange={(event) => onNameChange(event.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  setIsEditingName(false);
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setIsEditingName(false);
                }
              }}
              placeholder={defaultName}
              className="h-7 px-2 text-[10px]"
            />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] text-slate-500" title={displayName}>
                {displayName}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
