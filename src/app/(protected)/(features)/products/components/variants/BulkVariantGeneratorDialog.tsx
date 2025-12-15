'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateProductVariant,
  useGetAllProductVariants,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useCreateProductVariantSelection } from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { ProductVariantSelectionDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTOStatus';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkVariantGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  variantConfigId: number;
  configAttributes: SystemConfigAttributeDTO[];
}

interface GeneratedVariant {
  sku: string;
  price?: number;
  stockQuantity: number;
  selections: {
    attributeId: number;
    attributeName: string;
    optionId?: number;
    optionCode?: string;
    rawValue?: string;
  }[];
}

export function BulkVariantGeneratorDialog({
  open,
  onClose,
  productId,
  productName,
  variantConfigId,
  configAttributes,
}: BulkVariantGeneratorDialogProps) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>(undefined);
  const [defaultStock, setDefaultStock] = useState<number>(0);
  const [skuPrefix, setSkuPrefix] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());

  const createVariantMutation = useCreateProductVariant();
  const createSelectionMutation = useCreateProductVariantSelection();

  // Fetch existing variants to avoid duplicates
  const { data: existingVariants } = useGetAllProductVariants({
    'product.id.equals': productId,
    size: 1000,
  });

  // Fetch options for all ENUM attributes
  const enumAttributes = configAttributes.filter(
    (attr) => attr.attributeType === SystemConfigAttributeDTOAttributeType.ENUM
  );

  const attributeOptionsQueries = enumAttributes.map((attr) => {
    const { data } = useGetAllSystemConfigAttributeOptions({
      'attribute.id.equals': attr.id!,
      'status.equals': 'ACTIVE',
      size: 1000,
      sort: ['sortOrder,asc'],
    });
    return { attributeId: attr.id!, options: data || [] };
  });

  // Generate all possible combinations
  const generatedVariants = useMemo(() => {
    if (enumAttributes.length === 0) return [];

    // Get options for each attribute
    const attributeOptions = attributeOptionsQueries.map((query, index) => ({
      attribute: enumAttributes[index],
      options: query.options,
    }));

    // Generate cartesian product
    const combinations: GeneratedVariant[] = [];

    function generateCombinations(
      index: number,
      current: GeneratedVariant['selections']
    ) {
      if (index === attributeOptions.length) {
        // Build SKU from selections
        const skuParts = [skuPrefix || productName.substring(0, 4).toUpperCase()];
        current.forEach((sel) => {
          if (sel.optionCode) {
            skuParts.push(sel.optionCode);
          }
        });
        const sku = skuParts.join('-');

        // Check if SKU already exists
        const exists = existingVariants?.some((v) => v.sku === sku);
        if (!exists) {
          combinations.push({
            sku,
            price: defaultPrice,
            stockQuantity: defaultStock,
            selections: [...current],
          });
        }
        return;
      }

      const { attribute, options } = attributeOptions[index];
      options.forEach((option) => {
        generateCombinations(index + 1, [
          ...current,
          {
            attributeId: attribute.id!,
            attributeName: attribute.name,
            optionId: option.id!,
            optionCode: option.code,
          },
        ]);
      });
    }

    generateCombinations(0, []);
    return combinations;
  }, [
    enumAttributes,
    attributeOptionsQueries,
    existingVariants,
    skuPrefix,
    productName,
    defaultPrice,
    defaultStock,
  ]);

  // Initialize all variants as selected
  useMemo(() => {
    setSelectedVariants(new Set(generatedVariants.map((_, index) => index)));
  }, [generatedVariants]);

  const handleGenerate = async () => {
    if (selectedVariants.size === 0) {
      toast.error('Please select at least one variant to generate');
      return;
    }

    setGenerating(true);
    try {
      const variantsToCreate = generatedVariants.filter((_, index) =>
        selectedVariants.has(index)
      );

      let successCount = 0;
      let failureCount = 0;

      for (const variant of variantsToCreate) {
        try {
          // Create variant
          const createdVariant = await createVariantMutation.mutateAsync({
            data: {
              sku: variant.sku,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              status: ProductVariantDTOStatus.ACTIVE,
              product: { id: productId },
            } as any,
          });

          // Create selections
          for (const selection of variant.selections) {
            await createSelectionMutation.mutateAsync({
              data: {
                status: ProductVariantSelectionDTOStatus.ACTIVE,
                variant: { id: createdVariant.id },
                attribute: { id: selection.attributeId },
                option: selection.optionId ? { id: selection.optionId } : undefined,
                rawValue: selection.rawValue,
              } as any,
            });
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to create variant ${variant.sku}:`, error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully generated ${successCount} variant(s)`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to generate ${failureCount} variant(s)`);
      }

      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/product-variants' ||
          query.queryKey[0] === '/api/product-variant-selections',
      });

      onClose();
    } catch (error) {
      toast.error('Failed to generate variants');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleVariant = (index: number) => {
    setSelectedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedVariants.size === generatedVariants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(generatedVariants.map((_, index) => index)));
    }
  };

  if (enumAttributes.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Variant Generator</DialogTitle>
            <DialogDescription>
              Generate multiple variants automatically
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No ENUM-type attributes found in the variant configuration. Bulk generation is
              only available for configurations with dropdown/selection attributes.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Variant Generator</DialogTitle>
          <DialogDescription>
            Generate all possible variant combinations for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skuPrefix">SKU Prefix</Label>
              <Input
                id="skuPrefix"
                value={skuPrefix}
                onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                placeholder="e.g., PROD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input
                id="defaultPrice"
                type="number"
                step="0.01"
                value={defaultPrice || ''}
                onChange={(e) =>
                  setDefaultPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultStock">Default Stock</Label>
              <Input
                id="defaultStock"
                type="number"
                min="0"
                value={defaultStock}
                onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Variants Preview */}
          <div className="border rounded-lg flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedVariants.size === generatedVariants.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  {selectedVariants.size} of {generatedVariants.length} variants selected
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {generatedVariants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedVariants.has(index)}
                      onCheckedChange={() => toggleVariant(index)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{variant.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        {variant.selections
                          .map((sel) => `${sel.attributeName}: ${sel.optionCode}`)
                          .join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Price: ${variant.price?.toFixed(2) || 'N/A'} | Stock:{' '}
                        {variant.stockQuantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating || selectedVariants.size === 0}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate {selectedVariants.size} Variant{selectedVariants.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
