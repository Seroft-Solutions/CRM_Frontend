'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadImages } from '@/features/product-images';

const ORIENTATION_FIELDS = [
  {
    name: 'frontImage',
    label: 'Front Image',
    badge: 'Primary',
    description: 'Primary hero shot shown first to users.',
  },
  {
    name: 'backImage',
    label: 'Back Image',
    badge: 'Detail',
    description: 'Secondary angle that highlights the rear.',
  },
  {
    name: 'sideImage',
    label: 'Side Image',
    badge: 'Profile',
    description: 'Side profile to show product depth.',
  },
] as const;

type OrientationFieldName = (typeof ORIENTATION_FIELDS)[number]['name'];

interface OrientationSelection {
  [key: string]: File | null;
}

interface ProductOrientationUploaderProps {
  productId: number;
  organizationId: number;
  onUploadComplete?: () => void;
}

const createEmptySelection = () =>
  ORIENTATION_FIELDS.reduce<OrientationSelection>((acc, field) => {
    acc[field.name] = null;
    return acc;
  }, {});

const createEmptyPreviewMap = () =>
  ORIENTATION_FIELDS.reduce<Record<string, string | null>>((acc, field) => {
    acc[field.name] = null;
    return acc;
  }, {});

export function ProductOrientationUploader({
  productId,
  organizationId,
  onUploadComplete,
}: ProductOrientationUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<OrientationSelection>(createEmptySelection);
  const [previews, setPreviews] = useState<Record<string, string | null>>(createEmptyPreviewMap);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImagesMutation = useUploadImages();

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    const previewMap: Record<string, string | null> = {};

    ORIENTATION_FIELDS.forEach((field) => {
      const file = selectedFiles[field.name];
      if (file) {
        const url = URL.createObjectURL(file);
        previewMap[field.name] = url;
        cleanup.push(() => URL.revokeObjectURL(url));
      } else {
        previewMap[field.name] = null;
      }
    });

    setPreviews(previewMap);

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [selectedFiles]);

  const totalSelected = useMemo(
    () => ORIENTATION_FIELDS.filter((field) => Boolean(selectedFiles[field.name])).length,
    [selectedFiles]
  );

  const handleSelectFile = useCallback(
    (name: OrientationFieldName, file: File | null) => {
      setSelectedFiles((prev) => ({
        ...prev,
        [name]: file,
      }));
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    const filesToUpload = ORIENTATION_FIELDS.map((field) => selectedFiles[field.name]).filter(
      (file): file is File => !!file
    );

    if (!filesToUpload.length) {
      setError('Select at least one image to upload.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      await uploadImagesMutation.mutateAsync({
        productId,
        organizationId,
        files: filesToUpload,
      });

      setProgress(100);
      toast.success('Orientation images uploaded', {
        description: 'Front, back, and side shots are synced.',
      });
      setSelectedFiles(createEmptySelection());
      onUploadComplete?.();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Unable to upload product images.';
      setError(message);
      toast.error('Image upload failed', { description: message });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 400);
    }
  }, [
    isUploading,
    selectedFiles,
    uploadImagesMutation,
    productId,
    organizationId,
    onUploadComplete,
  ]);

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Orientation Upload</h3>
          <p className="text-sm text-slate-500">
            Upload up to three orientation-specific shots that define the gallery order.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
          Front · Back · Side
        </Badge>
      </div>

      <div className="space-y-3">
        {ORIENTATION_FIELDS.map((field) => (
          <OrientationSlot
            key={field.name}
            field={field}
            file={selectedFiles[field.name]}
            preview={previews[field.name]}
            onFileChange={(file) => handleSelectFile(field.name, file)}
          />
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isUploading && progress > 0 && <Progress value={progress} className="h-2" />}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button
          onClick={handleUpload}
          disabled={isUploading || totalSelected === 0}
          className="flex-1"
        >
          {isUploading ? 'Uploading...' : 'Upload Selected Images'}
        </Button>
        <span className="text-xs text-slate-500">
          {totalSelected} of {ORIENTATION_FIELDS.length} selected
        </span>
      </div>
    </div>
  );
}

const OrientationSlot = React.memo(
  ({
    field,
    file,
    preview,
    onFileChange,
  }: {
    field: (typeof ORIENTATION_FIELDS)[number];
    file: File | null;
    preview: string | null;
    onFileChange: (file: File | null) => void;
  }) => {
    const helperText = useMemo(() => {
      if (!file) {
        return 'Upload an image for this perspective.';
      }
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `${file.name} • ${sizeMb} MB`;
    }, [file]);

    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{field.label}</p>
            <p className="text-xs text-slate-500">{field.description}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {field.badge}
          </Badge>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {preview ? (
              <img src={preview} alt={`${field.label} preview`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Camera className="h-8 w-8" />
                <span className="text-xs font-medium">Drag & drop or browse</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <label
              className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100"
              htmlFor={`${field.name}-input`}
            >
              {file ? 'Replace' : 'Upload'}
            </label>
            {file && (
              <button
                type="button"
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-700"
                onClick={() => onFileChange(null)}
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{helperText}</p>
        </div>

        <input
          id={`${field.name}-input`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            onFileChange(selectedFile);
          }}
        />
      </div>
    );
  }
);
