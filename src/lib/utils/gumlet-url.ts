/**
 * Gumlet URL Utility
 *
 * Generates optimized image URLs using Gumlet Image CDN
 * Documentation: https://docs.gumlet.com/reference/image-transform-size
 */

const GUMLET_DOMAIN = process.env.NEXT_PUBLIC_GUMLET_DOMAIN || "";

export type GumletFormat = "auto" | "webp" | "avif" | "jpg" | "png";
export type GumletFit = "cover" | "contain" | "fill" | "inside" | "outside";

export interface GumletOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: GumletFormat;
  fit?: GumletFit;
  dpr?: number; // Device pixel ratio (1, 2, 3)
  compress?: boolean;
  crop?: boolean;
}

/**
 * Generate a Gumlet image URL with transformations
 *
 * @param gumletPath - The path to the image on Gumlet (from ProductImage.gumletPath)
 * @param options - Transformation options
 * @returns Optimized Gumlet URL
 *
 * @example
 * ```ts
 * // Thumbnail for product table (60x60px, cropped, compressed)
 * getGumletUrl("/products/img123.jpg", { width: 60, height: 60, crop: true, quality: 80 })
 * // => "https://your-subdomain.gumlet.io/products/img123.jpg?w=60&h=60&fit=cover&q=80&compress=true"
 *
 * // Full-size responsive image
 * getGumletUrl("/products/img123.jpg", { format: "auto", compress: true, dpr: 2 })
 * // => "https://your-subdomain.gumlet.io/products/img123.jpg?format=auto&compress=true&dpr=2"
 * ```
 */
export function getGumletUrl(
  gumletPath: string,
  options: GumletOptions = {}
): string {
  if (!gumletPath) {
    return "";
  }

  if (!GUMLET_DOMAIN) {
    console.warn("NEXT_PUBLIC_GUMLET_DOMAIN is not configured");
    return "";
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = gumletPath.startsWith("/")
    ? gumletPath.slice(1)
    : gumletPath;

  const baseUrl = `https://${GUMLET_DOMAIN}/${cleanPath}`;
  const params = new URLSearchParams();

  // Width
  if (options.width) {
    params.append("w", options.width.toString());
  }

  // Height
  if (options.height) {
    params.append("h", options.height.toString());
  }

  // Quality (1-100)
  if (options.quality) {
    params.append("q", Math.min(100, Math.max(1, options.quality)).toString());
  }

  // Format
  if (options.format) {
    params.append("format", options.format);
  }

  // Fit mode (applies when crop=true or both width/height specified)
  if (options.fit) {
    params.append("fit", options.fit);
  } else if (options.crop || (options.width && options.height)) {
    // Default to 'cover' for cropping/fixed dimensions
    params.append("fit", "cover");
  }

  // Device pixel ratio
  if (options.dpr) {
    params.append("dpr", options.dpr.toString());
  }

  // Compression
  if (options.compress) {
    params.append("compress", "true");
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate thumbnail URL for product table (60x60px)
 *
 * @param gumletPath - The path to the image on Gumlet
 * @returns Optimized thumbnail URL
 */
export function getThumbnailUrl(gumletPath: string): string {
  return getGumletUrl(gumletPath, {
    width: 60,
    height: 60,
    crop: true,
    quality: 80,
    format: "auto",
    compress: true,
  });
}

/**
 * Generate responsive image URL for product detail page
 *
 * @param gumletPath - The path to the image on Gumlet
 * @param width - Maximum width
 * @returns Optimized responsive URL
 */
export function getResponsiveUrl(gumletPath: string, width: number): string {
  return getGumletUrl(gumletPath, {
    width,
    format: "auto",
    compress: true,
    quality: 85,
  });
}

/**
 * Generate srcset for responsive images
 *
 * @param gumletPath - The path to the image on Gumlet
 * @param sizes - Array of widths to generate
 * @returns srcset string for <img> element
 *
 * @example
 * ```tsx
 * <img
 *   src={getResponsiveUrl(image.gumletPath, 800)}
 *   srcSet={getResponsiveSrcSet(image.gumletPath, [400, 800, 1200])}
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
 * />
 * ```
 */
export function getResponsiveSrcSet(
  gumletPath: string,
  sizes: number[] = [400, 800, 1200]
): string {
  return sizes
    .map((size) => `${getResponsiveUrl(gumletPath, size)} ${size}w`)
    .join(", ");
}

/**
 * Check if Gumlet is properly configured
 *
 * @returns true if GUMLET_DOMAIN is set
 */
export function isGumletConfigured(): boolean {
  return Boolean(GUMLET_DOMAIN);
}
