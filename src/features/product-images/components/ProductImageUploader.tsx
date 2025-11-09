'use client';

import { useState } from 'react';
import { useUploadImages } from '@/features/product-images';
import { useFileSelection } from '../hooks/useFileSelection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ImageDropZone } from './ImageDropZone';
import { ImagePreviewGrid } from './ImagePreviewGrid';

interface ProductImageUploaderProps {
  productId: number;
  organizationId: number;
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_FILE_SIZE = 5;

/**
 * ProductImageUploader - Main orchestrator for image upload workflow
 * Supports drag-and-drop, preview, and batch upload
 */
export function ProductImageUploader({
  productId,
  organizationId,
  onUploadComplete,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { selectedFiles, error, addFiles, removeFile, clearAll, setError } = useFileSelection({
    maxFiles,
    maxFileSize,
  });

  const uploadMutation = useUploadImages();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setError(null);
    setUploadProgress(0);

    try {
      const files = selectedFiles.map((f) => f.file);

      await uploadMutation.mutateAsync({
        productId,
        organizationId,
        files,
      });

      clearAll();
      setUploadProgress(100);

      toast.success('Success!', {
        description: `Successfully uploaded ${files.length} image(s)`,
      });

      onUploadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      toast.error('Upload Failed', { description: errorMessage });
    }
  };

  return (
    <div className="space-y-4">
      <ImageDropZone
        isDragging={isDragging}
        maxFileSize={maxFileSize}
        maxFiles={maxFiles}
        allowedFormats={ALLOWED_FORMATS}
        onFileSelect={addFiles}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Selected Files ({selectedFiles.length})
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <ImagePreviewGrid files={selectedFiles} onRemove={removeFile} />

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || selectedFiles.length === 0}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>

          {uploadMutation.isSuccess && uploadProgress === 100 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Images uploaded successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
