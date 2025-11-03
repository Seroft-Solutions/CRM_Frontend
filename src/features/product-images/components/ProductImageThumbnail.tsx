"use client";
// Micro-component for displaying product image thumbnails in table views
// Used in: Product table to show primary product image

import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ProductImageThumbnailProps {
  /** CDN URL of the primary image */
  imageUrl?: string | null;
  /** Product name for alt text */
  productName?: string;
  /** Thumbnail size in pixels (default: 40) */
  size?: number;
  /** Optional custom class names */
  className?: string;
}

/**
 * ProductImageThumbnail Component
 *
 * Displays a small product image thumbnail optimized for table views.
 * Shows a placeholder icon when no image is available.
 *
 * @example
 * ```tsx
 * <ProductImageThumbnail
 *   imageUrl={product.primaryImageUrl}
 *   productName={product.name}
 *   size={40}
 * />
 * ```
 */
export function ProductImageThumbnail({
  imageUrl,
  productName = "Product",
  size = 40,
  className = "",
}: ProductImageThumbnailProps) {
  if (!imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width: size, height: size }}
        title={`No image for ${productName}`}
      >
        <ImageIcon className="text-gray-400" size={size * 0.5} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded border border-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageUrl}
        alt={`${productName} image`}
        fill
        className="object-cover"
        sizes={`${size}px`}
        unoptimized // Gumlet CDN already optimizes images
      />
    </div>
  );
}
