'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useGetAllProductVariants,
  useCreateProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  useCreateProductVariantSelection,
  useGetAllProductVariantSelections,
} from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetSystemConfig } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { getGetAllSystemConfigAttributeOptionsQueryOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Sparkles, Trash2, Eye } from 'lucide-react';
import { ProductVariantSelectionDTO } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTO';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { ProductVariantSelectionDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTOStatus';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';

interface ProductVariantManagerProps {
  productId: number;
  productName: string;
  variantConfigId?: number;
}

export function ProductVariantManager({
  productId,
  productName,
  variantConfigId,
}: ProductVariantManagerProps) {
  const queryClient = useQueryClient();

  const defaultGeneratedStatus = ProductVariantDTOStatus.ACTIVE;
  const [selectedOptionIdsByAttributeId, setSelectedOptionIdsByAttributeId] = useState<Record<number, Set<number>>>({});
  const [draftVariantsByKey, setDraftVariantsByKey] = useState<Record<string, DraftVariantRow>>({});
  const [isSavingDrafts, setIsSavingDrafts] = useState(false);

  // Fetch variants for this product
  const { data: variants } = useGetAllProductVariants({
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

  const optionById = useMemo(() => {
    const map = new Map<number, { label: string; code?: string }>();
    attributeOptionsResults.forEach((result) => {
      result.data?.forEach((opt) => {
        if (typeof opt.id === 'number') {
          map.set(opt.id, {
            label: opt.label ?? opt.code ?? '',
            code: opt.code ?? undefined,
          });
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

  const createVariantMutation = useCreateProductVariant();
  const createSelectionMutation = useCreateProductVariantSelection();

  const existingSkus = useMemo(() => new Set((variants ?? []).map((v) => v.sku)), [variants]);

  const buildCombinationKey = useMemo(() => {
    return (parts: Array<{ attributeId: number; optionId: number }>) => {
      return parts
        .slice()
        .sort((a, b) => {
          const aOrder = attributeOrderMap.get(a.attributeId) ?? Number.MAX_SAFE_INTEGER;
          const bOrder = attributeOrderMap.get(b.attributeId) ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.attributeId - b.attributeId;
        })
        .map((p) => `${p.attributeId}:${p.optionId}`)
        .join('|');
    };
  }, [attributeOrderMap]);

  const existingCombinationKeys = useMemo(() => {
    const set = new Set<string>();
    Object.values(selectionsByVariantId).forEach((selections) => {
      const parts: Array<{ attributeId: number; optionId: number }> = [];
      selections.forEach((s) => {
        const attributeId = s.attribute?.id;
        const optionId = s.option?.id;
        if (typeof attributeId === 'number' && typeof optionId === 'number') {
          parts.push({ attributeId, optionId });
        }
      });
      if (parts.length > 0) {
        set.add(buildCombinationKey(parts));
      }
    });
    return set;
  }, [selectionsByVariantId, buildCombinationKey]);

  const attributeById = useMemo(() => {
    const map = new Map<number, { label: string; name: string; sortOrder: number }>();
    (configAttributes ?? []).forEach((attr) => {
      if (typeof attr.id === 'number') {
        map.set(attr.id, {
          label: attr.label ?? attr.name ?? 'Attribute',
          name: attr.name ?? '',
          sortOrder: attr.sortOrder ?? 999,
        });
      }
    });
    return map;
  }, [configAttributes]);

  const existingVariantRows = useMemo(() => {
    const list = (variants ?? [])
      .filter((v) => typeof v.id === 'number')
      .map((variant) => {
        const selections = selectionsByVariantId[variant.id!] ?? [];
        const rowSelections: VariantSelection[] = selections
          .filter((s) => typeof s.attribute?.id === 'number' && typeof s.option?.id === 'number')
          .map((s) => {
            const attributeId = s.attribute!.id!;
            const optionId = s.option!.id!;
            const attrMeta = attributeById.get(attributeId);
            const optionLabel = s.option?.label ?? optionLabelById.get(optionId) ?? '';

            return {
              attributeId,
              attributeLabel: attrMeta?.label ?? s.attribute?.label ?? s.attribute?.name ?? 'Attribute',
              optionId,
              optionLabel,
              optionCode: s.option?.code,
            };
          });

        return {
          id: variant.id!,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          status: variant.status,
          selections: rowSelections,
        };
      });

    return list;
  }, [variants, selectionsByVariantId, optionLabelById, attributeById]);

  const enumAttributeOptions = useMemo(() => {
    return enumAttributes
      .filter((attr) => typeof attr.id === 'number')
      .map((attr, index) => ({
        attribute: attr,
        options: attributeOptionsResults[index]?.data ?? [],
      }));
  }, [enumAttributes, attributeOptionsResults]);

  const draftCombinations = useMemo(() => {
    if (!variantConfigId) return [];
    if (enumAttributeOptions.length === 0) return [];
    if (isLoadingOptions) return [];

    const basePrefix = (productName.substring(0, 4) || 'PROD').toUpperCase();

    const selectionsForCrossProduct = enumAttributeOptions
      .map(({ attribute, options }) => {
        const attributeId = attribute.id!;
        const selectedSet = selectedOptionIdsByAttributeId[attributeId];
        const selectedOptions = options.filter((o) => typeof o.id === 'number' && selectedSet?.has(o.id));
        return {
          attribute,
          selectedOptions,
        };
      })
      .filter(({ attribute }) => typeof attribute.id === 'number')
      .filter((x) => x.selectedOptions.length > 0);

    if (selectionsForCrossProduct.length === 0) return [];

    const rows: DraftVariantRow[] = [];

    const sortedAttributes = [...selectionsForCrossProduct].sort((a, b) => {
      const aOrder = attributeOrderMap.get(a.attribute.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = attributeOrderMap.get(b.attribute.id ?? -1) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    function generate(index: number, current: VariantSelection[]) {
      if (index === sortedAttributes.length) {
        const skuParts = [basePrefix];
        current.forEach((sel) => {
          if (sel.optionCode) skuParts.push(sel.optionCode);
        });
        const sku = skuParts.join('-');
        const key = buildCombinationKey(current.map((s) => ({ attributeId: s.attributeId, optionId: s.optionId })));

        if (existingSkus.has(sku)) return;
        if (existingCombinationKeys.has(key)) return;

        rows.push({
          key,
          sku,
          price: undefined,
          stockQuantity: 0,
          status: defaultGeneratedStatus,
          selections: current,
        });
        return;
      }

      const { attribute, selectedOptions } = sortedAttributes[index];
      selectedOptions.forEach((opt) => {
        const optionMeta = typeof opt.id === 'number' ? optionById.get(opt.id) : undefined;
        const attrMeta = attributeById.get(attribute.id!);
        generate(index + 1, [
          ...current,
          {
            attributeId: attribute.id!,
            attributeLabel: attrMeta?.label ?? attribute.label ?? attribute.name ?? 'Attribute',
            optionId: opt.id!,
            optionLabel: optionMeta?.label ?? opt.label ?? opt.code ?? '',
            optionCode: opt.code,
          },
        ]);
      });
    }

    generate(0, []);
    return rows;
  }, [
    variantConfigId,
    enumAttributeOptions,
    isLoadingOptions,
    productName,
    selectedOptionIdsByAttributeId,
    attributeOrderMap,
    existingSkus,
    existingCombinationKeys,
    defaultGeneratedStatus,
    optionById,
    buildCombinationKey,
    attributeById,
  ]);

  useEffect(() => {
    setDraftVariantsByKey((prev) => {
      const next: Record<string, DraftVariantRow> = {};
      draftCombinations.forEach((row) => {
        const existing = prev[row.key];
        next[row.key] = existing
          ? {
              ...row,
              sku: existing.sku,
              price: existing.price,
              stockQuantity: existing.stockQuantity,
              status: existing.status,
            }
          : row;
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) return next;

      for (const key of nextKeys) {
        const a = prev[key];
        const b = next[key];
        if (!a || !b) return next;

        if (a.sku !== b.sku) return next;
        if (a.price !== b.price) return next;
        if (a.stockQuantity !== b.stockQuantity) return next;
        if (a.status !== b.status) return next;

        const sigA = a.selections
          .map((s) => `${s.attributeId}:${s.optionId ?? ''}`)
          .slice()
          .sort()
          .join('|');
        const sigB = b.selections
          .map((s) => `${s.attributeId}:${s.optionId ?? ''}`)
          .slice()
          .sort()
          .join('|');
        if (sigA !== sigB) return next;
      }

      return prev;
    });
  }, [draftCombinations]);

  const draftVariants = useMemo(
    () => Object.values(draftVariantsByKey),
    [draftVariantsByKey]
  );

  const combinedRows = useMemo(() => {
    return [
      ...draftVariants.map((d) => ({ kind: 'draft' as const, rowKey: `draft-${d.key}`, row: d })),
      ...existingVariantRows.map((e) => ({ kind: 'existing' as const, rowKey: `existing-${e.id}`, row: e })),
    ];
  }, [draftVariants, existingVariantRows]);

  const visibleEnumAttributes = useMemo(() => {
    return enumAttributes
      .filter((attr) => typeof attr.id === 'number')
      .slice()
      .sort((a, b) => {
        const aOrder = attributeOrderMap.get(a.id!) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = attributeOrderMap.get(b.id!) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });
  }, [enumAttributes, attributeOrderMap]);

  const missingRequiredEnumAttributes = useMemo(() => {
    return visibleEnumAttributes
      .filter((attr) => attr.isRequired)
      .filter((attr) => (selectedOptionIdsByAttributeId[attr.id!] ?? new Set<number>()).size === 0);
  }, [visibleEnumAttributes, selectedOptionIdsByAttributeId]);

  const canSaveDrafts =
    draftVariants.length > 0 &&
    missingRequiredEnumAttributes.length === 0 &&
    !isLoadingSelections;

  const toggleOption = (attributeId: number, optionId: number) => {
    setSelectedOptionIdsByAttributeId((prev) => {
      const next: Record<number, Set<number>> = { ...prev };
      const currentSet = new Set(next[attributeId] ?? []);
      if (currentSet.has(optionId)) currentSet.delete(optionId);
      else currentSet.add(optionId);
      next[attributeId] = currentSet;
      return next;
    });
  };

  const handleSaveDrafts = async () => {
    if (draftVariants.length === 0) {
      toast.error('No generated variants to save');
      return;
    }

    if (missingRequiredEnumAttributes.length > 0) {
      toast.error(
        `Select at least one option for required attributes: ${missingRequiredEnumAttributes
          .map((a) => a.label ?? a.name)
          .join(', ')}`
      );
      return;
    }

    const skuPattern = /^[A-Za-z0-9_-]+$/;
    const invalidSku = draftVariants.find((v) => !v.sku || v.sku.length < 2 || v.sku.length > 50 || !skuPattern.test(v.sku));
    if (invalidSku) {
      toast.error(`Invalid SKU: ${invalidSku.sku || '(empty)'}`);
      return;
    }

    setIsSavingDrafts(true);
    try {
      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      for (const variant of draftVariants) {
        try {
          if (existingSkus.has(variant.sku) || existingCombinationKeys.has(variant.key)) {
            skippedCount++;
            continue;
          }

          const createdVariant = await createVariantMutation.mutateAsync({
            data: {
              sku: variant.sku,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              status: variant.status,
              product: { id: productId },
            } as any,
          });

          for (const selection of variant.selections) {
            await createSelectionMutation.mutateAsync({
              data: {
                status: ProductVariantSelectionDTOStatus.ACTIVE,
                variant: { id: createdVariant.id },
                attribute: { id: selection.attributeId },
                option: selection.optionId ? { id: selection.optionId } : undefined,
              } as any,
            });
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to create variant ${variant.sku}:`, error);
          failureCount++;
        }
      }

      if (successCount > 0) toast.success(`Created ${successCount} variant(s)`);
      if (failureCount > 0) toast.error(`Failed to create ${failureCount} variant(s)`);
      if (skippedCount > 0) toast.message(`Skipped ${skippedCount} duplicate variant(s)`);

      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/product-variants' ||
          query.queryKey[0] === '/api/product-variant-selections',
      });

      setSelectedOptionIdsByAttributeId({});
      setDraftVariantsByKey({});
    } finally {
      setIsSavingDrafts(false);
    }
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
      </div>

      {/* Inline Generator */}
      <div className="rounded-md border bg-muted/20 p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Create Variants</h3>
              <Badge
                variant={draftVariants.length > 0 ? 'default' : 'secondary'}
                className={
                  draftVariants.length > 0
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90'
                    : 'text-foreground'
                }
              >
                {draftVariants.length} generated
              </Badge>
              {missingRequiredEnumAttributes.length > 0 && (
                <Badge className="bg-sidebar text-sidebar-foreground border-sidebar-border/60">
                  {missingRequiredEnumAttributes.length} missing
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Click attribute options to generate combinations, edit fields inline, then save.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveDrafts} disabled={isSavingDrafts || !canSaveDrafts}>
              {isSavingDrafts ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Save {draftVariants.length} Variant{draftVariants.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {missingRequiredEnumAttributes.length > 0 && (
          <Alert>
            <AlertDescription>
              Missing required selections: {missingRequiredEnumAttributes
                .map((a) => a.label ?? a.name)
                .join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingSelections && (
          <Alert>
            <AlertDescription>
              Loading existing variant selections… duplicate prevention by attribute options will run once loading finishes.
            </AlertDescription>
          </Alert>
        )}

        {visibleEnumAttributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ENUM attributes found for this configuration.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleEnumAttributes.map((attr) => {
              const attributeId = attr.id!;
              const options = enumAttributeOptions.find((x) => x.attribute.id === attributeId)?.options ?? [];
              const selectedSet = selectedOptionIdsByAttributeId[attributeId] ?? new Set<number>();
              return (
                <div key={attributeId} className="rounded-md border bg-background p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{attr.label ?? attr.name}</p>
                      <div className="flex items-center gap-2">
                        {attr.isRequired && (
                          <Badge
                            className={
                              selectedSet.size > 0
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground border-transparent'
                                : 'bg-sidebar text-sidebar-foreground border-sidebar-border/60'
                            }
                          >
                            Required
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-foreground">
                          {selectedSet.size} selected
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => {
                      const optId = opt.id;
                      if (typeof optId !== 'number') return null;
                      const isSelected = selectedSet.has(optId);
                      const label = opt.label ?? opt.code ?? '';
                      return (
                        <Button
                          key={optId}
                          type="button"
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          className={
                            isSelected
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90'
                              : 'text-foreground hover:bg-sidebar-accent/10'
                          }
                          aria-pressed={isSelected}
                          onClick={() => toggleOption(attributeId, optId)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {visibleEnumAttributes.length > 0 && !isLoadingOptions && missingRequiredEnumAttributes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Tip: You can select options for only one attribute to generate partial variants.
          </p>
        )}

        {combinedRows.length > 0 && (
          <div className="rounded-md border bg-background">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold">Variants Table</h4>
                <Badge variant="outline" className="text-xs">
                  {existingVariantRows.length} saved
                </Badge>
                {draftVariants.length > 0 && (
                  <Badge className="bg-blue-500 text-white text-xs">
                    {draftVariants.length} draft
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {combinedRows.length} row(s)
              </p>
            </div>
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {visibleEnumAttributes.map((attr) => (
                        <TableHead key={`attr-${attr.id}`} className="font-semibold">
                          {attr.label ?? attr.name}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Stock</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedRows.map((item) => {
                      const isDraft = item.kind === 'draft';
                      return (
                        <TableRow 
                          key={item.rowKey}
                          className={isDraft ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-muted/30'}
                        >
                          {visibleEnumAttributes.map((attr) => {
                            const selection = item.row.selections.find((s) => s.attributeId === attr.id);
                            return (
                              <TableCell key={`${item.rowKey}-${attr.id}`} className="py-3">
                                {selection ? (
                                  <Badge 
                                    variant="secondary"
                                    className="bg-sidebar-accent text-sidebar-accent-foreground border-transparent font-normal"
                                  >
                                    {selection.optionLabel}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="py-3">
                            {isDraft ? (
                              <div className="space-y-1">
                                <Input
                                  className="h-9"
                                  value={item.row.sku}
                                  onChange={(e) => {
                                    setDraftVariantsByKey((prev) => ({
                                      ...prev,
                                      [item.row.key]: { ...prev[item.row.key], sku: e.target.value },
                                    }));
                                  }}
                                />
                                {existingSkus.has(item.row.sku) && (
                                  <p className="text-xs text-red-600">Duplicate SKU</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-medium bg-muted px-2 py-1 rounded">
                                  {item.row.sku}
                                </code>
                                <Badge variant="outline" className="text-xs">Saved</Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              className="h-9"
                              type="number"
                              step="0.01"
                              placeholder={isDraft ? 'Price' : ''}
                              value={item.row.price ?? ''}
                              disabled={!isDraft}
                              onChange={(e) => {
                                if (!isDraft) return;
                                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                setDraftVariantsByKey((prev) => ({
                                  ...prev,
                                  [item.row.key]: { ...prev[item.row.key], price: value },
                                }));
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              className="h-9"
                              type="number"
                              min="0"
                              placeholder={isDraft ? 'Quantity' : ''}
                              value={item.row.stockQuantity}
                              disabled={!isDraft}
                              onChange={(e) => {
                                if (!isDraft) return;
                                const value = parseInt(e.target.value) || 0;
                                setDraftVariantsByKey((prev) => ({
                                  ...prev,
                                  [item.row.key]: { ...prev[item.row.key], stockQuantity: value },
                                }));
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <Select
                              value={item.row.status}
                              disabled={!isDraft}
                              onValueChange={(v) => {
                                if (!isDraft) return;
                                setDraftVariantsByKey((prev) => ({
                                  ...prev,
                                  [item.row.key]: { ...prev[item.row.key], status: v as ProductVariantDTOStatus },
                                }));
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ProductVariantDTOStatus.ACTIVE}>Active</SelectItem>
                                <SelectItem value={ProductVariantDTOStatus.INACTIVE}>Inactive</SelectItem>
                                <SelectItem value={ProductVariantDTOStatus.ARCHIVED}>Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

interface VariantSelection {
  attributeId: number;
  attributeLabel: string;
  optionId: number;
  optionLabel: string;
  optionCode?: string;
}

interface DraftVariantRow {
  key: string;
  sku: string;
  price?: number;
  stockQuantity: number;
  status: ProductVariantDTOStatus;
  selections: VariantSelection[];
}

interface ExistingVariantRow {
  id: number;
  sku: string;
  price?: number;
  stockQuantity: number;
  status: ProductVariantDTOStatus;
  selections: VariantSelection[];
}
