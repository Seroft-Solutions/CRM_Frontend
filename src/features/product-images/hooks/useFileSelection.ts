import { useState } from 'react';
import type { FileWithPreview } from '../components/ImagePreviewGrid';

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

interface UseFileSelectionOptions {
  maxFiles: number;
  maxFileSize: number;
}

/**
 * useFileSelection - Hook for managing file selection and validation
 * Handles file validation, preview generation, and state management
 */
export function useFileSelection({ maxFiles, maxFileSize }: UseFileSelectionOptions) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return `${file.name}: Invalid format. Only JPEG, PNG, and WEBP are allowed.`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `${file.name}: File size exceeds ${maxFileSize}MB limit.`;
    }
    return null;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      const preview = URL.createObjectURL(file);

      console.log('Created preview URL:', preview, 'for file:', file.name, 'type:', file.type);

      newFiles.push({
        file,
        preview,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      });
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    } else {
      setError(null);
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
        console.log('Revoked preview URL:', file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    selectedFiles.forEach((f) => {
      URL.revokeObjectURL(f.preview);
      console.log('Revoked preview URL:', f.preview);
    });
    setSelectedFiles([]);
    setError(null);
  };

  return {
    selectedFiles,
    error,
    addFiles,
    removeFile,
    clearAll,
    setError,
  };
}
