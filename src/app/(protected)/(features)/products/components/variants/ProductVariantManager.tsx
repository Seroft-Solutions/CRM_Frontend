'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAllProductVariants,
  useDeleteProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetSystemConfig } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Sparkles } from 'lucide-react';
import { ProductVariantFormDialog } from './ProductVariantFormDialog';
import { BulkVariantGeneratorDialog } from './BulkVariantGeneratorDialog';

interface ProductVariantManagerProps {
  productId: number;
  productName: string;
  variantConfigId?: number;
}

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;
  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ProductVariantManager({
  productId,
  productName,
  variantConfigId,
}: ProductVariantManagerProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkGeneratorDialog, setShowBulkGeneratorDialog] = useState(false);
  const [editVariantId, setEditVariantId] = useState<number | null>(null);
  const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch variants for this product
  const { data: variants, isLoading: isLoadingVariants } = useGetAllProductVariants({
    'product.id.equals': productId,
    size: 1000,
    sort: ['sku,asc'],
  });

  // Fetch variant config and its attributes
  const { data: variantConfig } = useGetSystemConfig(variantConfigId!, {
    query: { enabled: !!variantConfigId },
  });

  const { data: configAttributes } = useGetAllSystemConfigAttributes({
    'systemConfig.id.equals': variantConfigId!,
    size: 1000,
    sort: ['sortOrder,asc'],
  }, {
    query: { enabled: !!variantConfigId },
  });

  const deleteMutation = useDeleteProductVariant();

  const handleDelete = async () => {
    if (!deleteVariantId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteVariantId });
      toast.success('Variant deleted successfully');
      setShowDeleteDialog(false);
      setDeleteVariantId(null);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === '/api/product-variants',
      });
    } catch (error) {
      toast.error('Failed to delete variant');
      console.error(error);
    }
  };

  const handleEditClick = (variantId: number) => {
    setEditVariantId(variantId);
    setShowAddDialog(true);
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditVariantId(null);
  };

  if (!variantConfigId) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
        <div className="max-w-md mx-auto">
          <div className="mb-4 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Variant Configuration
          </h3>
          <p className="text-gray-600 mb-4">
            Please select a variant configuration for this product before adding variants.
          </p>
          <p className="text-sm text-gray-500">
            Edit the product and choose a System Config that defines the variant attributes
            (e.g., size, color, material).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Product Variants</h2>
          <p className="text-sm text-muted-foreground">
            Configuration: {variantConfig?.configKey || 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkGeneratorDialog(true)}
            disabled={!configAttributes || configAttributes.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {/* Variants Table */}
      {isLoadingVariants ? (
        <div className="p-8 text-center">Loading variants...</div>
      ) : variants && variants.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.sku}</TableCell>
                  <TableCell>
                    {variant.price ? `$${variant.price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.stockQuantity > 0 ? 'default' : 'destructive'}>
                      {variant.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      View details to see attributes
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {transformEnumValue(variant.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(variant.id!)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteVariantId(variant.id!);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
          <div className="max-w-md mx-auto">
            <div className="mb-4 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variants Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first variant for {productName}
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Variant
              </Button>
              {configAttributes && configAttributes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkGeneratorDialog(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate All
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Variant Dialog */}
      <ProductVariantFormDialog
        open={showAddDialog}
        onClose={handleDialogClose}
        productId={productId}
        productName={productName}
        variantConfigId={variantConfigId}
        variantId={editVariantId}
        configAttributes={configAttributes || []}
      />

      {/* Bulk Generator Dialog */}
      <BulkVariantGeneratorDialog
        open={showBulkGeneratorDialog}
        onClose={() => setShowBulkGeneratorDialog(false)}
        productId={productId}
        productName={productName}
        variantConfigId={variantConfigId}
        configAttributes={configAttributes || []}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
