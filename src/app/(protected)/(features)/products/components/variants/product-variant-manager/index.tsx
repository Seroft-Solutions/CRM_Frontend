'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useGetAllProductVariants,
  useCreateProductVariant,
  useUpdateProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  useCreateProductVariantSelection,
  useGetAllProductVariantSelections,
} from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetSystemConfig } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { getGetAllSystemConfigAttributeOptionsQueryOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { ProductVariantSelectionDTO } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTO';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { ProductVariantSelectionDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTOStatus';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DraftVariantRow, ExistingVariantRow, VariantSelection } from './types';
import { NoVariantConfigPlaceholder } from './NoVariantConfigPlaceholder';
import { VariantGenerator } from './VariantGenerator';
import { VariantsTable } from './VariantsTable';

/**
 * @interface ProductVariantManagerProps
 * @description Props for the ProductVariantManager component.
 * @property {number} productId - The ID of the product to manage variants for.
 * @property {string} productName - The name of the product.
 * @property {number} [variantConfigId] - The ID of the system configuration for variants.
 */
interface ProductVariantManagerProps {
  productId: number;
  productName: string;
  variantConfigId?: number;
}

/**
 * @component ProductVariantManager
 * @description The main container component for managing product variants. It handles all data fetching,
 * state management, and business logic, and delegates rendering to smaller, specialized sub-components.
 * It allows users to generate new variant combinations from product attributes, edit them, and save them.
 * @param {ProductVariantManagerProps} props - The props for the component.
 * @returns {JSX.Element} The rendered product variant management interface.
 */
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
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRowData, setEditingRowData] = useState<ExistingVariantRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductVariantDTOStatus>(ProductVariantDTOStatus.ACTIVE);
  const PAGE_SIZE = 10;

  // #region Data Fetching
  const { data: variants, isLoading: isLoadingVariants } = useGetAllProductVariants({
    'productId.equals': productId,
    'status.equals': statusFilter,
    size: 1000,
    sort: ['sku,asc'],
  });

  useEffect(() => {
    setCurrentPage(1);
    setEditingRowData(null);
  }, [statusFilter]);

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
  // #endregion

  // #region Memoized Data Transformation
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

  const existingVariantRows: ExistingVariantRow[] = useMemo(() => {
    return (variants ?? [])
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
  }, [variants, selectionsByVariantId, optionLabelById, attributeById]);

  const enumAttributeOptions = useMemo(() => {
    return enumAttributes
      .filter((attr) => typeof attr.id === 'number')
      .map((attr, index) => ({
        attribute: attr,
        options: attributeOptionsResults[index]?.data ?? [],
      }));
  }, [enumAttributes, attributeOptionsResults]);
  // #endregion

  // #region Draft Variant Generation
  const draftCombinations = useMemo(() => {
    if (!variantConfigId || enumAttributeOptions.length === 0 || isLoadingOptions) return [];

    const basePrefix = (productName.substring(0, 4) || 'PROD').toUpperCase();

    const selectionsForCrossProduct = enumAttributeOptions
      .map(({ attribute, options }) => ({
        attribute,
        selectedOptions: options.filter((o) => typeof o.id === 'number' && selectedOptionIdsByAttributeId[attribute.id!]?.has(o.id!)),
      }))
      .filter(({ attribute }) => typeof attribute.id === 'number' && attribute.id)
      .filter((x) => x.selectedOptions.length > 0);

    if (selectionsForCrossProduct.length === 0) return [];

    const rows: DraftVariantRow[] = [];
    const sortedAttributes = [...selectionsForCrossProduct].sort((a, b) =>
      (attributeOrderMap.get(a.attribute.id!) ?? 999) - (attributeOrderMap.get(b.attribute.id!) ?? 999)
    );

    function generate(index: number, current: VariantSelection[]) {
      if (index === sortedAttributes.length) {
        const skuParts = [basePrefix, ...current.map(sel => sel.optionCode).filter(Boolean)];
        const sku = skuParts.join('-');
        const key = buildCombinationKey(current.map(s => ({ attributeId: s.attributeId, optionId: s.optionId })));

        if (!existingSkus.has(sku) && !existingCombinationKeys.has(key)) {
          rows.push({
            key,
            sku,
            price: undefined,
            stockQuantity: 0,
            status: defaultGeneratedStatus,
            selections: current,
          });
        }
        return;
      }

      const { attribute, selectedOptions } = sortedAttributes[index];
      selectedOptions.forEach((opt) => {
        const optionMeta = typeof opt.id === 'number' ? optionById.get(opt.id) : undefined;
        generate(index + 1, [
          ...current,
          {
            attributeId: attribute.id!,
            attributeLabel: attribute.label ?? attribute.name ?? 'Attribute',
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
  ]);

  useEffect(() => {
    setDraftVariantsByKey((prev) => {
      const next: Record<string, DraftVariantRow> = {};
      draftCombinations.forEach((row) => {
        const existing = prev[row.key];
        next[row.key] = existing ? { ...row, ...existing } : row;
      });
      // Basic check to prevent re-render if only references changed
      if (JSON.stringify(Object.keys(prev)) === JSON.stringify(Object.keys(next))) {
        return prev;
      }
      return next;
    });
  }, [draftCombinations]);

  const draftVariants = useMemo(() => Object.values(draftVariantsByKey), [draftVariantsByKey]);
  // #endregion

  const precomputeDisabledOptionIds = useMemo(() => {
    const disabledOptions = new Set<number>();

    // Collect all currently selected attribute options from state
    const currentSelectedAttributeOptions: Array<{ attributeId: number; optionId: number }> = [];
    Object.entries(selectedOptionIdsByAttributeId).forEach(([attrIdStr, optionIdSet]) => {
      const attributeId = parseInt(attrIdStr, 10);
      optionIdSet.forEach(optionId => {
        currentSelectedAttributeOptions.push({ attributeId, optionId });
      });
    });

    // For each attribute that has ENUM options
    enumAttributeOptions.forEach(({ attribute, options }) => {
      const currentAttributeId = attribute.id!;

      // For each option in that attribute
      options.forEach(option => {
        const currentOptionId = option.id!;

        // If this option is already selected for its attribute, it should NOT be disabled.
        // This mechanism is for preventing *new* selections that lead to duplicates.
        if (selectedOptionIdsByAttributeId[currentAttributeId]?.has(currentOptionId)) {
          return;
        }

        // Create a hypothetical set of selections if this option were chosen
        const hypotheticalSelections = [
          // All currently selected options from *other* attributes
          ...currentSelectedAttributeOptions.filter(s => s.attributeId !== currentAttributeId),
          // Plus the current option being evaluated
          { attributeId: currentAttributeId, optionId: currentOptionId }
        ];

        // Only check for duplication if there are selections to form a key
        if (hypotheticalSelections.length > 0) {
          const hypotheticalCombinationKey = buildCombinationKey(hypotheticalSelections);

          // If this hypothetical combination key already exists
          if (existingCombinationKeys.has(hypotheticalCombinationKey)) {
            disabledOptions.add(currentOptionId);
          }
        }
      });
    });

    return disabledOptions;
  }, [
    enumAttributeOptions,
    selectedOptionIdsByAttributeId,
    existingCombinationKeys,
    buildCombinationKey,
  ]);


  // #region Combined Logic & UI State
  const combinedRows = useMemo(() => {
    return [
      ...draftVariants.map((d) => ({ kind: 'draft' as const, rowKey: `draft-${d.key}`, row: d })),
      ...existingVariantRows.map((e) => ({ kind: 'existing' as const, rowKey: `existing-${e.id}`, row: e })),
    ];
  }, [draftVariants, existingVariantRows]);

  const totalPages = Math.ceil(combinedRows.length / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return combinedRows.slice(start, end);
  }, [combinedRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
  // #endregion

  // #region Mutations & Handlers
  const createVariantMutation = useCreateProductVariant();
  const createSelectionMutation = useCreateProductVariantSelection();
  const updateVariantMutation = useUpdateProductVariant();

  const invalidateVariantQueries = () => {
    return queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === '/api/product-variants' ||
        query.queryKey[0] === '/api/product-variant-selections',
    });
  }

  const handleUpdateEditingRow = (updatedValues: Partial<ExistingVariantRow>) => {
    if (!editingRowData) return;
    setEditingRowData(prev => prev ? { ...prev, ...updatedValues } : null);
  };

  const handleSaveExisting = async () => {
    if (!editingRowData) return;

    const payload = {
      id: editingRowData.id,
      sku: editingRowData.sku,
      price: editingRowData.price,
      stockQuantity: editingRowData.stockQuantity,
      status: editingRowData.status,
      product: { id: productId },
    };

    toast.promise(
      updateVariantMutation.mutateAsync({
        id: editingRowData.id,
        data: payload as any,
      }),
      {
        loading: 'Saving variant...',
        success: async () => {
          await invalidateVariantQueries();
          setEditingRowData(null);
          return 'Variant saved successfully.';
        },
        error: (err) => `Failed to save: ${err.message}`,
      }
    );
  };

  const handleArchiveRow = (row: ExistingVariantRow) => {
    const payload = {
      id: row.id,
      sku: row.sku,
      price: row.price,
      stockQuantity: row.stockQuantity,
      status: ProductVariantDTOStatus.ARCHIVED,
      product: { id: productId },
    };
    toast.promise(
      updateVariantMutation.mutateAsync({
        id: row.id,
        data: payload as any,
      }),
      {
        loading: 'Archiving variant...',
        success: async () => {
          await invalidateVariantQueries();
          return 'Variant archived.';
        },
        error: (err) => `Failed to archive: ${err.message}`,
      }
    );
  };


  const toggleOption = (attributeId: number, optionId: number) => {
    setSelectedOptionIdsByAttributeId((prev) => {
      const next = { ...prev };
      const currentSet = new Set(next[attributeId] ?? []);
      if (currentSet.has(optionId)) currentSet.delete(optionId);
      else currentSet.add(optionId);
      next[attributeId] = currentSet;
      return next;
    });
  };

  const updateDraft = (key: string, updatedValues: Partial<DraftVariantRow>) => {
    setDraftVariantsByKey(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updatedValues }
    }));
  };
  
  const handleSaveDrafts = async () => {
    if (!canSaveDrafts) {
      toast.error('Cannot save variants.', { description: 'Check for missing required options or wait for loading to complete.' });
      return;
    }

    const skuPattern = /^[A-Za-z0-9_-]+$/;
    const invalidSku = draftVariants.find((v) => !v.sku || v.sku.length < 2 || v.sku.length > 50 || !skuPattern.test(v.sku));
    if (invalidSku) {
      toast.error(`Invalid SKU: ${invalidSku.sku || '(empty)'}`);
      return;
    }

    setIsSavingDrafts(true);
    let successCount = 0, failureCount = 0, skippedCount = 0;

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
    if (skippedCount > 0) toast.info(`Skipped ${skippedCount} duplicate variant(s)`);

    await invalidateVariantQueries();

    setSelectedOptionIdsByAttributeId({});
    setDraftVariantsByKey({});
    setIsSavingDrafts(false);
  };
  // #endregion

  if (!variantConfigId) {
    return <NoVariantConfigPlaceholder />;
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

      <VariantGenerator
        draftVariantsCount={draftVariants.length}
        missingRequiredEnumAttributes={missingRequiredEnumAttributes}
        isLoadingSelections={isLoadingSelections}
        isLoadingOptions={isLoadingOptions}
        enumAttributeOptions={enumAttributeOptions}
        selectedOptionIdsByAttributeId={selectedOptionIdsByAttributeId}
        visibleEnumAttributes={visibleEnumAttributes}
        onSave={handleSaveDrafts}
        isSaving={isSavingDrafts}
        canSave={canSaveDrafts}
        onToggleOption={toggleOption}
        disabledOptionIds={precomputeDisabledOptionIds}
      />

      <div className="space-y-2">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductVariantDTOStatus)}>
          <TabsList>
            <TabsTrigger value={ProductVariantDTOStatus.ACTIVE}>Active</TabsTrigger>
            <TabsTrigger value={ProductVariantDTOStatus.INACTIVE}>Inactive</TabsTrigger>
            <TabsTrigger value={ProductVariantDTOStatus.ARCHIVED}>Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <VariantsTable
          rows={paginatedRows}
          existingVariantRows={existingVariantRows}
          draftVariants={draftVariants}
          visibleEnumAttributes={visibleEnumAttributes}
          existingSkus={existingSkus}
          onUpdateDraft={updateDraft}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          editingRowData={editingRowData}
          onEditRow={setEditingRowData}
          onUpdateEditingRow={handleUpdateEditingRow}
          onSaveExisting={handleSaveExisting}
          onCancelEdit={() => setEditingRowData(null)}
          onArchiveRow={handleArchiveRow}
          isLoading={isLoadingVariants || isLoadingSelections}
        />
      </div>
    </div>
  );
}
