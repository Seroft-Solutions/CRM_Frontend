"use client";
// JUSTIFICATION: Requires file input interaction and drag-drop event handlers

import { useRef } from "react";
import { Upload } from "lucide-react";

interface ImageDropZoneProps {
  isDragging: boolean;
  maxFileSize: number;
  maxFiles: number;
  allowedFormats: string[];
  onFileSelect: (files: FileList | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

/**
 * ImageDropZone - Drag-and-drop file upload zone
 * Micro-component for file selection UI
 */
export function ImageDropZone({
  isDragging,
  maxFileSize,
  maxFiles,
  allowedFormats,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: ImageDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }
      `}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedFormats.join(",")}
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            Drop images here or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, WEBP • Max {maxFileSize}MB • Up to {maxFiles} files
          </p>
        </div>
      </div>
    </div>
  );
}
