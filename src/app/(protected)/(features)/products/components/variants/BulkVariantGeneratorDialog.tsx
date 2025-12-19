'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  useCreateProductVariant,
  useGetAllProductVariants,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useCreateProductVariantSelection } from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { getGetAllSystemConfigAttributeOptionsQueryOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
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
    'productId.equals': productId,
    size: 1000,
  });

  // Fetch options for all ENUM attributes
  const enumAttributes = useMemo(
    () =>
      configAttributes.filter(
        (attr) => attr.attributeType === SystemConfigAttributeDTOAttributeType.ENUM
      ),
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
        { query: { enabled: open && !!attr.id } }
      )
    ),
  });

  // Generate all possible combinations
  const generatedVariants = useMemo(() => {
    if (!open) return [];
    if (enumAttributes.length === 0) return [];

    // Get options for each attribute
    const attributeOptions = enumAttributes.map((attribute, index) => ({
      attribute,
      options: attributeOptionsResults[index]?.data || [],
    }));

    // Generate cartesian product
    const combinations: GeneratedVariant[] = [];

    function generateCombinations(
      index: number,
      current: GeneratedVariant['selections']
    ) {
      if (index === attributeOptions.length) {
        // Build SKU from selections
        const cleanOptionCode = (code: string | undefined) => {
          if (!code) return code;
          return code.startsWith('#') ? code.substring(1) : code;
        };
        const skuParts = [skuPrefix || productName.substring(0, 4).toUpperCase()];
        current.forEach((sel) => {
          const cleanedCode = cleanOptionCode(sel.optionCode);
          if (cleanedCode) {
            skuParts.push(cleanedCode);
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
    open,
    enumAttributes,
    attributeOptionsResults,
    existingVariants,
    skuPrefix,
    productName,
    defaultPrice,
    defaultStock,
  ]);

  // Initialize all variants as selected when opening, and keep selection indices valid.
  useEffect(() => {
    if (!open) return;

    setSelectedVariants((prev) => {
      const all = new Set<number>();
      for (let i = 0; i < generatedVariants.length; i++) {
        all.add(i);
      }

      if (prev.size === all.size) {
        let isSame = true;
        for (const index of prev) {
          if (!all.has(index)) {
            isSame = false;
            break;
          }
        }
        if (isSame) return prev;
      }

      if (prev.size === 0) return all;

      const normalized = new Set<number>();
      for (const index of prev) {
        if (all.has(index)) {
          normalized.add(index);
        }
      }

      return normalized.size === 0 ? all : normalized;
    });
  }, [open, generatedVariants.length]);

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
        <DialogContent className="max-w-md bg-gradient-to-br from-background to-background/95 border-2 border-primary/10 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/20 flex items-center justify-center shadow-sm">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Bulk Variant Generator</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Generate multiple variants automatically
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium">
              No ENUM-type attributes found in the variant configuration. Bulk generation is
              only available for configurations with dropdown/selection attributes.
            </AlertDescription>
          </Alert>
          <DialogFooter className="border-t-2 border-border/50 pt-4">
            <Button onClick={onClose} className="px-6 h-10 font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background to-background/95 border-2 border-primary/10 shadow-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shadow-sm">
              <span className="text-lg">🔄</span>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Bulk Variant Generator</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Generate all possible variant combinations for {productName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Configuration */}
          <div className="p-6 rounded-xl border-2 border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">⚙️</span>
              </div>
              <h3 className="text-base font-bold text-foreground">Configuration</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="skuPrefix" className="text-sm font-semibold text-foreground">SKU Prefix</Label>
                <Input
                  id="skuPrefix"
                  value={skuPrefix}
                  onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g., PROD"
                  className="h-11 border-2 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="defaultPrice" className="text-sm font-semibold text-foreground">Default Price</Label>
                <Input
                  id="defaultPrice"
                  type="number"
                  step="0.01"
                  value={defaultPrice || ''}
                  onChange={(e) =>
                    setDefaultPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="Optional"
                  className="h-11 border-2 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="defaultStock" className="text-sm font-semibold text-foreground">Default Stock</Label>
                <Input
                  id="defaultStock"
                  type="number"
                  min="0"
                  value={defaultStock}
                  onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
                  className="h-11 border-2 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Variants Preview */}
          <div className="border-2 border-border/50 rounded-xl flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedVariants.size === generatedVariants.length}
                  onCheckedChange={toggleAll}
                  className="border-2 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm font-bold text-foreground">
                  {selectedVariants.size} of {generatedVariants.length} variants selected
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {generatedVariants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border-2 border-border/30 rounded-lg bg-background/60 hover:bg-background/80 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                  >
                    <Checkbox
                      checked={selectedVariants.has(index)}
                      onCheckedChange={() => toggleVariant(index)}
                      className="border-2 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-bold text-sm text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20 inline-block">
                        {variant.sku}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {variant.selections
                          .map((sel) => `${sel.attributeName}: ${sel.optionCode}`)
                          .join(' • ')}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 font-medium">
                          💰 {variant.price?.toFixed(2) || 'N/A'}
                        </span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium">
                          📦 {variant.stockQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-border/50 pt-6 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={generating}
            className="px-6 h-11 font-semibold hover:bg-muted/80 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedVariants.size === 0}
            className="px-6 h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {generating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Generate {selectedVariants.size} Variant{selectedVariants.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
