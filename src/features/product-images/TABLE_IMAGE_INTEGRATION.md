# Product Image Integration in Table View

## Overview

This guide explains how to integrate product images into the auto-generated product table view. Since `product-table.tsx` and `product-table-row.tsx` are auto-generated files, you'll need to manually add the image column after each code regeneration.

## Quick Integration Steps

### Step 1: Add Image Column to ALL_COLUMNS Configuration

**File**: `CRM_Frontend/src/app/(protected)/(features)/products/components/product-table.tsx`

**Location**: Inside the `ALL_COLUMNS` array (around line 143)

**Add this entry** (preferably after the `id` column):

```typescript
{
  id: 'image',
  label: 'Image',
  accessor: 'primaryImageUrl', // This will come from ProductDTO
  type: 'field',
  visible: true,
  sortable: false,
},
```

### Step 2: Import ProductImageThumbnail Component

**File**: `CRM_Frontend/src/app/(protected)/(features)/products/components/table/product-table-row.tsx`

**Location**: Top of file, after other imports (around line 27)

```typescript
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
```

### Step 3: Add Image Column Rendering Logic

**File**: `CRM_Frontend/src/app/(protected)/(features)/products/components/table/product-table-row.tsx`

**Location**: Inside the field rendering logic (around line 178, before the final `return field?.toString() || '';`)

```typescript
if (column.id === 'image') {
  const primaryImageUrl = product.images?.find(img => img.isPrimary === true)?.cdnUrl ||
                          product.images?.[0]?.cdnUrl ||
                          null;

  return (
    <ProductImageThumbnail
      imageUrl={primaryImageUrl}
      productName={product.name || 'Product'}
      size={40}
    />
  );
}
```

## Complete Code Snippet for Step 3

For easier integration, here's the complete code snippet with context:

```typescript
// ... existing field rendering logic ...

if (column.id === 'lastModifiedDate') {
  return field ? format(new Date(field as string), 'PPP') : '';
}

// ADD THIS NEW BLOCK:
if (column.id === 'image') {
  const primaryImageUrl = product.images?.find(img => img.isPrimary === true)?.cdnUrl ||
                          product.images?.[0]?.cdnUrl ||
                          null;

  return (
    <ProductImageThumbnail
      imageUrl={primaryImageUrl}
      productName={product.name || 'Product'}
      size={40}
    />
  );
}

return field?.toString() || '';
```

## Verification

After implementing the changes:

1. Restart your development server: `npm run dev`
2. Navigate to the products table
3. You should see an "Image" column with:
   - Product image thumbnails (40x40px) for products with images
   - Gray placeholder icon for products without images
4. The column should be visible by default
5. Users can hide/show it using the "Columns" dropdown

## Backend Requirements

### ProductDTO Must Include Images

Ensure your backend `ProductDTO` includes the images relationship:

```java
@Schema(description = "Product with images")
public class ProductDTO {
    // ... other fields ...

    private Set<ProductImageDTO> images;

    // Derived property for easy access to primary image URL
    public String getPrimaryImageUrl() {
        return images.stream()
            .filter(ProductImageDTO::getIsPrimary)
            .map(ProductImageDTO::getCdnUrl)
            .findFirst()
            .orElseGet(() -> images.stream()
                .findFirst()
                .map(ProductImageDTO::getCdnUrl)
                .orElse(null));
    }
}
```

### API Endpoint Must Load Images

Ensure the product list endpoint loads images with the product:

```java
@GetMapping("/products")
public ResponseEntity<List<ProductDTO>> getAllProducts(
    @ParameterObject Pageable pageable
) {
    Page<Product> page = productService.findAllWithImages(pageable);
    // ... rest of the implementation
}
```

**Service layer**:
```java
@Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.deletedAt IS NULL")
Page<Product> findAllWithImages(Pageable pageable);
```

## Troubleshooting

### Images Not Showing

1. **Check API Response**: Verify that `GET /api/products` includes `images` field in the response
2. **Check Image URLs**: Ensure `cdnUrl` field is populated in the `ProductImageDTO`
3. **Check Component Import**: Verify `ProductImageThumbnail` is imported correctly
4. **Check Console**: Look for any image loading errors in browser console

### Images Not Loading from CDN

1. **CORS Issues**: Ensure Gumlet CDN allows requests from your domain
2. **URL Format**: Verify CDN URLs are complete and valid
3. **Next.js Config**: You may need to add Gumlet domain to `next.config.js`:

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gumlet.io', // Replace with your Gumlet domain
      },
    ],
  },
};
```

### Performance Concerns

If loading many products with images:

1. **Implement Pagination**: Already implemented (default: 10 items per page)
2. **Use Thumbnail URLs**: Ensure backend returns optimized thumbnail URLs (60x60px)
3. **Lazy Loading**: Next.js Image component handles this automatically
4. **Database Indexing**: Ensure `product_image` table has proper indexes

## Advanced: Custom Column Position

To control where the image column appears:

1. Move the image column entry in `ALL_COLUMNS` array to desired position
2. Example: Place it right after the "name" column for better visibility

```typescript
{
  id: 'name',
  label: 'Name',
  accessor: 'name',
  type: 'field',
  visible: true,
  sortable: true,
},
{
  id: 'image', // Image column right after name
  label: 'Image',
  accessor: 'primaryImageUrl',
  type: 'field',
  visible: true,
  sortable: false,
},
{
  id: 'code',
  label: 'Code',
  // ...
},
```

## Maintenance Notes

**IMPORTANT**: Since `product-table.tsx` and `product-table-row.tsx` are auto-generated:

- You'll need to reapply these changes after running code generation scripts
- Consider creating a post-generation script to automate these changes
- Document any customizations in your team's development guide
- Keep this integration file updated with any changes

## Component Reference

The `ProductImageThumbnail` component (located at `src/features/product-images/components/ProductImageThumbnail.tsx`) provides:

- **Size**: Configurable (default 40px)
- **Fallback**: Gray placeholder with icon when no image exists
- **Optimization**: Uses Next.js Image for automatic optimization
- **CDN**: Works with Gumlet CDN (unoptimized flag set)
- **Accessibility**: Proper alt text for screen readers

## Status

- ✅ ProductImageThumbnail component created (115 lines)
- ✅ Integration documentation complete
- ⚠️ Manual integration required in auto-generated files
- ✅ Backend support exists (images relationship in ProductDTO)

Last updated: 2025-11-03
