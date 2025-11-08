'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

export interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

interface ImagePreviewGridProps {
  files: FileWithPreview[];
  onRemove: (id: string) => void;
}

/**
 * ImagePreviewGrid - Display selected files with preview thumbnails
 * Micro-component for file preview UI with proper image loading
 */
export function ImagePreviewGrid({ files, onRemove }: ImagePreviewGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((fileWithPreview) => (
        <ImagePreviewItem
          key={fileWithPreview.id}
          fileWithPreview={fileWithPreview}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function ImagePreviewItem({
  fileWithPreview,
  onRemove,
}: {
  fileWithPreview: FileWithPreview;
  onRemove: (id: string) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      {/* Loading State - Show spinner while loading */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-10">
          <span className="text-sm text-red-500 font-medium">Failed to load</span>
          <span className="text-xs text-red-400 mt-1">Invalid image</span>
        </div>
      )}

      {/* Image Element - Always render but hide until loaded */}
      <img
        src={fileWithPreview.preview}
        alt={fileWithPreview.file.name}
        className="w-full h-full object-cover"
        style={{
          display: imageLoaded ? 'block' : 'none',
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', fileWithPreview.file.name);
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load preview:', {
            fileName: fileWithPreview.file.name,
            previewUrl: fileWithPreview.preview,
            fileType: fileWithPreview.file.type,
            fileSize: fileWithPreview.file.size,
            error: e,
          });
          setImageError(true);
        }}
      />

      {/* Remove Button Overlay */}
      {imageLoaded && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(fileWithPreview.id);
            }}
            className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            aria-label={`Remove ${fileWithPreview.file.name}`}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      )}

      {/* File Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-xs text-white truncate font-medium">{fileWithPreview.file.name}</p>
        <p className="text-xs text-gray-300">
          {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
