'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useGetAllProductVariants,
  useDeleteProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetAllProductVariantSelections } from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetSystemConfig } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { getGetAllSystemConfigAttributeOptionsQueryOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Sparkles } from 'lucide-react';
import { ProductVariantFormDialog } from './ProductVariantFormDialog';
import { BulkVariantGeneratorDialog } from './BulkVariantGeneratorDialog';
import { ProductVariantSelectionDTO } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTO';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';

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

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) return '—';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(price);
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
  const [viewVariantId, setViewVariantId] = useState<number | null>(null);

  // Fetch variants for this product
  const { data: variants, isLoading: isLoadingVariants } = useGetAllProductVariants({
    'productId.equals': productId,
    size: 1000,
    sort: ['sku,asc'],
  });

  // Fetch variant config and its attributes
  const { data: variantConfig } = useGetSystemConfig(variantConfigId!, {
    query: { enabled: !!variantConfigId },
  });

  const { data: configAttributes, isLoading: isLoadingAttributes } = useGetAllSystemConfigAttributes({
    'systemConfigId.equals': variantConfigId!,
    size: 1000,
    sort: ['sortOrder,asc'],
  }, {
    query: { enabled: !!variantConfigId },
  });

  const variantIds = useMemo(
    () => (variants ?? []).map((variant) => variant.id!).filter((id): id is number => typeof id === 'number'),
    [variants]
  );

  const { data: variantSelections, isLoading: isLoadingSelections } = useGetAllProductVariantSelections(
    variantIds.length > 0
      ? {
          'variantId.in': variantIds,
          size: 2000,
        }
      : undefined,
    {
      query: { enabled: variantIds.length > 0 },
    }
  );

  const enumAttributes = useMemo(
    () => (configAttributes ?? []).filter((attr) => attr.attributeType === SystemConfigAttributeDTOAttributeType.ENUM),
    [configAttributes]
  );

  const attributeOptionsResults = useQueries({
    queries: enumAttributes.map((attr) =>
      getGetAllSystemConfigAttributeOptionsQueryOptions(
        {
          'attributeId.equals': attr.id!,
          'status.equals': 'ACTIVE',
          size: 1000,
          sort: ['sortOrder,asc'],
        },
        { query: { enabled: !!attr.id } }
      )
    ),
  });

  const optionLabelById = useMemo(() => {
    const map = new Map<number, string>();
    attributeOptionsResults.forEach((result) => {
      result.data?.forEach((opt) => {
        if (typeof opt.id === 'number') {
          map.set(opt.id, opt.label ?? opt.code ?? '');
        }
      });
    });
    return map;
  }, [attributeOptionsResults]);

  const isLoadingOptions = attributeOptionsResults.some((result) => result.isLoading);

  const attributeOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    (configAttributes ?? []).forEach((attr, index) => {
      if (typeof attr.id === 'number') {
        map.set(attr.id, attr.sortOrder ?? index);
      }
    });
    return map;
  }, [configAttributes]);

  const selectionsByVariantId = useMemo(() => {
    const map: Record<number, ProductVariantSelectionDTO[]> = {};
    (variantSelections ?? []).forEach((selection) => {
      const vId = selection.variant?.id;
      if (!vId) return;
      if (!map[vId]) map[vId] = [];
      map[vId].push(selection);
    });
    return map;
  }, [variantSelections]);

  const selectedVariant = useMemo(
    () => variants?.find((v) => v.id === viewVariantId),
    [variants, viewVariantId]
  );

  const selectedSelections = useMemo(
    () => (viewVariantId ? selectionsByVariantId[viewVariantId] ?? [] : []),
    [viewVariantId, selectionsByVariantId]
  );

  const orderedSelectedSelections = useMemo(() => {
    const list = [...selectedSelections];
    return list.sort((a, b) => {
      const aOrder = attributeOrderMap.get(a.attribute?.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = attributeOrderMap.get(b.attribute?.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.attribute?.id ?? 0) - (b.attribute?.id ?? 0);
    });
  }, [selectedSelections, attributeOrderMap]);

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
          {isLoadingAttributes && (
            <p className="text-sm text-muted-foreground mt-1">Loading attributes...</p>
          )}
          {!isLoadingAttributes && configAttributes && (
            <p className="text-sm text-muted-foreground mt-1">
              {configAttributes.length} attribute{configAttributes.length !== 1 ? 's' : ''} configured
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkGeneratorDialog(true)}
            disabled={isLoadingAttributes || !configAttributes || configAttributes.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)} disabled={isLoadingAttributes}>
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
                <TableRow
                  key={variant.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewVariantId(variant.id!)}
                >
                  <TableCell className="font-medium">{variant.sku}</TableCell>
                  <TableCell>
                    {formatPrice(variant.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.stockQuantity > 0 ? 'default' : 'destructive'}>
                      {variant.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isLoadingSelections || isLoadingOptions ? (
                      <span className="text-sm text-muted-foreground">Loading attributes...</span>
                    ) : (() => {
                      const selections = selectionsByVariantId[variant.id!] ?? [];
                      if (selections.length === 0) {
                        return (
                          <span className="text-sm text-muted-foreground">No attributes set</span>
                        );
                      }

                      const orderedSelections = [...selections].sort((a, b) => {
                        const aOrder = attributeOrderMap.get(a.attribute?.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
                        const bOrder = attributeOrderMap.get(b.attribute?.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return (a.attribute?.id ?? 0) - (b.attribute?.id ?? 0);
                      });

                      return (
                        <div className="flex flex-wrap gap-2 max-w-[420px]">
                          {orderedSelections.map((selection) => {
                            const label = selection.attribute?.label || selection.attribute?.name || 'Attribute';
                            const value =
                              selection.option?.label ??
                              (selection.option?.id ? optionLabelById.get(selection.option.id) : undefined) ??
                              selection.rawValue ??
                              '—';
                            const selectionKey = `${variant.id}-${selection.attribute?.id}-${selection.option?.id ?? selection.rawValue ?? 'value'}`;

                            return (
                              <Badge key={selectionKey} variant="secondary">
                                {label}: {value}
                              </Badge>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {transformEnumValue(variant.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewVariantId(variant.id!);
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(variant.id!);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
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
      <Dialog open={!!viewVariantId} onOpenChange={(open) => !open && setViewVariantId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variant Details</DialogTitle>
            <DialogDescription>
              {selectedVariant ? `SKU: ${selectedVariant.sku}` : 'Loading variant...'}
            </DialogDescription>
          </DialogHeader>

          {selectedVariant ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">{formatPrice(selectedVariant.price)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Stock</p>
                  <div>
                    <Badge variant={selectedVariant.stockQuantity > 0 ? 'default' : 'destructive'}>
                      {selectedVariant.stockQuantity}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedVariant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {transformEnumValue(selectedVariant.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Attributes</p>
                {orderedSelectedSelections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attributes set</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {orderedSelectedSelections.map((selection) => {
                      const label = selection.attribute?.label || selection.attribute?.name || 'Attribute';
                      const value =
                        selection.option?.label ??
                        (selection.option?.id ? optionLabelById.get(selection.option.id) : undefined) ??
                        selection.rawValue ??
                        '—';
                      const key = `${selectedVariant.id}-${selection.attribute?.id}-${selection.option?.id ?? selection.rawValue ?? 'value'}`;

                      return (
                        <Badge key={key} variant="secondary">
                          {label}: {value}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Variant not found.</p>
          )}
        </DialogContent>
      </Dialog>

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
