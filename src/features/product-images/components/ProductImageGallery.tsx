'use client';

import { ProductImageDTO } from '../hooks/useProductImages';
import { Trash2, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductImageGalleryProps {
  images: ProductImageDTO[];
  onDelete?: (imageId: number) => void;
  onReorder?: (imageIds: number[]) => void;
  isReordering?: boolean;
}

export function ProductImageGallery({
  images,
  onDelete,
  onReorder,
  isReordering = false,
}: ProductImageGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No images uploaded yet</p>
      </div>
    );
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    const imageIds = newImages.map((img) => img.id).filter((id): id is number => id !== undefined);
    onReorder?.(imageIds);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <Card key={image.id} className="overflow-hidden">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm truncate">{image.originalFilename}</CardTitle>
              {image.isPrimary && (
                <Badge variant="default" className="ml-2">
                  Primary
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-square relative bg-gray-100">
              {image.thumbnailUrl || image.cdnUrl ? (
                <img
                  src={image.thumbnailUrl || image.cdnUrl}
                  alt={image.originalFilename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No preview
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-3 flex-col items-start gap-2">
            <div className="text-xs text-gray-500 w-full">
              <p>{image.format?.toUpperCase()}</p>
              <p>{(image.fileSizeBytes / 1024).toFixed(1)} KB</p>
              {image.width && image.height && (
                <p>
                  {image.width} × {image.height}
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full">
              {isReordering && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="flex-1"
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="flex-1"
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              {onDelete && image.id !== undefined && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(image.id!)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
