/**
 * Image Validation Utility
 *
 * Client-side validation for product image uploads
 * Validates file type, size, and dimensions before upload
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MIN_DIMENSION = 100; // pixels
export const MAX_IMAGES_PER_UPLOAD = 10;
export const MAX_IMAGES_PER_PRODUCT = 20;

export const ALLOWED_FORMATS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_FORMATS;

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  dimensions?: ImageDimensions;
}

/**
 * Validate a single image file
 *
 * @param file - The File object to validate
 * @returns Promise with validation result
 *
 * @example
 * ```ts
 * const result = await validateImageFile(file);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn(result.warnings);
 * }
 * ```
 */
export async function validateImageFile(
  file: File
): Promise<ImageValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate file type
  if (!Object.keys(ALLOWED_FORMATS).includes(file.type)) {
    errors.push({
      code: "INVALID_FORMAT",
      message: `File format '${file.type}' is not supported. Allowed formats: JPEG, PNG, WEBP`,
      field: "format",
    });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      code: "FILE_TOO_LARGE",
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`,
      field: "size",
    });
  }

  if (file.size === 0) {
    errors.push({
      code: "EMPTY_FILE",
      message: "File is empty",
      field: "size",
    });
  }

  // If basic validations fail, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
    };
  }

  // Validate dimensions (requires loading image)
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
      warnings.push({
        code: "SMALL_DIMENSIONS",
        message: `Image dimensions (${dimensions.width}x${dimensions.height}px) are below recommended minimum (${MIN_DIMENSION}x${MIN_DIMENSION}px). Image may appear blurry.`,
        field: "dimensions",
      });
    }

    return {
      valid: true,
      errors,
      warnings,
      dimensions,
    };
  } catch (error) {
    errors.push({
      code: "INVALID_IMAGE",
      message:
        error instanceof Error
          ? `Failed to read image: ${error.message}`
          : "Failed to read image",
      field: "content",
    });

    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Validate multiple image files
 *
 * @param files - Array of File objects to validate
 * @param currentImageCount - Number of images already uploaded for this product
 * @returns Promise with validation results for each file
 */
export async function validateImageFiles(
  files: File[],
  currentImageCount: number = 0
): Promise<{
  results: ImageValidationResult[];
  globalErrors: ValidationError[];
}> {
  const globalErrors: ValidationError[] = [];

  // Validate upload limit
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    globalErrors.push({
      code: "TOO_MANY_FILES",
      message: `Cannot upload more than ${MAX_IMAGES_PER_UPLOAD} images at once. You selected ${files.length} images.`,
    });
  }

  // Validate total product image limit
  const totalAfterUpload = currentImageCount + files.length;
  if (totalAfterUpload > MAX_IMAGES_PER_PRODUCT) {
    const allowedCount = MAX_IMAGES_PER_PRODUCT - currentImageCount;
    globalErrors.push({
      code: "PRODUCT_IMAGE_LIMIT",
      message: `Product already has ${currentImageCount} image(s). You can only add ${allowedCount} more (maximum ${MAX_IMAGES_PER_PRODUCT} per product).`,
    });
  }

  // Validate each file
  const results = await Promise.all(
    files.map((file) => validateImageFile(file))
  );

  return {
    results,
    globalErrors,
  };
}

/**
 * Get image dimensions from a File object
 *
 * @param file - The File object
 * @returns Promise with dimensions
 */
function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if a mime type is allowed
 *
 * @param mimeType - The mime type to check
 * @returns true if allowed
 */
export function isAllowedFormat(mimeType: string): boolean {
  return Object.keys(ALLOWED_FORMATS).includes(mimeType);
}

/**
 * Get file extension from mime type
 *
 * @param mimeType - The mime type
 * @returns File extension (e.g., ".jpg") or empty string if not found
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions = ALLOWED_FORMATS[mimeType as AllowedMimeType];
  return extensions ? extensions[0] : "";
}

/**
 * Get accepted file types string for input element
 *
 * @returns Comma-separated list of accepted mime types
 *
 * @example
 * ```tsx
 * <input type="file" accept={getAcceptString()} multiple />
 * ```
 */
export function getAcceptString(): string {
  return Object.keys(ALLOWED_FORMATS).join(",");
}
