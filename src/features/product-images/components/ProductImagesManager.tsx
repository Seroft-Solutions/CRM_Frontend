'use client';

import { useState } from 'react';
import {
  ProductImageGallery,
  ProductImageUploader,
  useDeleteImage,
  useProductImages,
  useReorderImages,
} from '@/features/product-images';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight } from 'lucide-react';

interface ProductImagesManagerProps {
  productId: number;
  organizationId: number;
}

/**
 * Complete product images management interface.
 * Handles upload, display, delete, and reorder operations.
 */
export function ProductImagesManager({ productId, organizationId }: ProductImagesManagerProps) {
  const [isReordering, setIsReordering] = useState(false);

  const { data: images = [], isLoading, refetch } = useProductImages(productId);
  const deleteImage = useDeleteImage();
  const reorderImages = useReorderImages();

  const handleUploadComplete = () => {
    refetch();
  };

  const handleDelete = async (imageId: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      await deleteImage.mutateAsync(imageId);
    }
  };

  const handleReorder = async (imageIds: number[]) => {
    await reorderImages.mutateAsync({ productId, imageIds });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gallery">Gallery ({images.length})</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>
                    Manage your product images - delete or reorder as needed
                  </CardDescription>
                </div>
                {images.length > 0 && (
                  <Button
                    variant={isReordering ? 'default' : 'outline'}
                    onClick={() => setIsReordering(!isReordering)}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    {isReordering ? 'Done Reordering' : 'Reorder'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading images...</div>
              ) : (
                <ProductImageGallery
                  images={images}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                  isReordering={isReordering}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Upload up to 10 images at once. Supports JPG, PNG, and WebP formats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImageUploader
                productId={productId}
                organizationId={organizationId}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
