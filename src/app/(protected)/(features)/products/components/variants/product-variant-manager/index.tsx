'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useGetAllProductVariants,
  useUpdateProductVariant,
  useDeleteProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetAllProductVariantSelections } from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { getGetAllSystemConfigAttributeOptionsQueryOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import { ProductVariantSelectionDTO } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTO';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';

import {
  DraftVariantRow,
  ExistingVariantRow,
  VariantSelection,
  VariantTableSelection,
} from './types';
import { VARIANT_IMAGE_ORDER } from '@/features/product-variant-images/utils/variant-image-slots';
import { NoVariantConfigPlaceholder } from './NoVariantConfigPlaceholder';
import { VariantGenerator } from './VariantGenerator';
import { VariantsTable } from './VariantsTable';

const normalizeSizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const sizeRankByToken = (() => {
  const map = new Map<string, number>();
  const groups = [
    ['xxxl', '3xl'],
    ['xxl', '2xl'],
    ['xl', 'xlarge', 'extralarge', 'extralarger'],
    ['l', 'large'],
    ['m', 'medium', 'med'],
    ['s', 'small'],
    ['xs', 'xsmall', 'extrasmall', 'exsmall'],
    ['xxs', '2xs'],
    ['xxxs', '3xs'],
  ];
  groups.forEach((tokens, index) => {
    tokens.forEach((token) => map.set(token, index));
  });
  return map;
})();
const isSizeLabel = (label?: string) => {
  if (!label) return false;
  const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
  return normalized === 'size' || normalized.startsWith('size') || normalized.endsWith('size');
};

/**
 * @interface ProductVariantManagerProps
 * @description Props for the ProductVariantManager component.
 * @property {number} [productId] - The ID of the product to manage variants for (optional for create mode).
 * @property {string} productName - The name of the product.
 * @property {number} [variantConfigId] - The ID of the system configuration for variants.
 * @property {UseFormReturn<Record<string, unknown>>} [form] - React Hook Form instance for create mode.
 * @property {boolean} [isViewMode] - Whether the component is in view-only mode.
 * @property {VariantTableSelection} [selection] - Optional selection controls for read-only tables.
 */
interface ProductVariantManagerProps {
  productId?: number;
  productName: string;
  variantConfigId?: number;
  form?: UseFormReturn<Record<string, unknown>>;
  defaultVariantPrice?: number;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
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
  form,
  defaultVariantPrice,
  isViewMode = false,
  selection,
}: ProductVariantManagerProps) {
  const queryClient = useQueryClient();

  const defaultGeneratedStatus = ProductVariantDTOStatus.ACTIVE;
  const [preSelectedOptionIdsByAttributeId, setPreSelectedOptionIdsByAttributeId] = useState<
    Record<number, Set<number>>
  >({});
  const [userSelectedOptionIdsByAttributeId, setUserSelectedOptionIdsByAttributeId] = useState<
    Record<number, Set<number>>
  >({});
  const [draftVariantsByKey, setDraftVariantsByKey] = useState<Record<string, DraftVariantRow>>({});
  const [editingRowData, setEditingRowData] = useState<ExistingVariantRow | null>(null);
  const createEmptyImageFiles = () =>
    VARIANT_IMAGE_ORDER.reduce(
      (acc, slot) => {
        acc[slot] = null;
        return acc;
      },
      {} as Record<(typeof VARIANT_IMAGE_ORDER)[number], File | null>
    );
  const normalizeSku = (value: string, fallback: string) => {
    const sanitized = value.replace(/[^A-Za-z0-9_-]+/g, '');
    return sanitized.length > 0 ? sanitized : fallback;
  };

  // Combine pre-selected and user-selected options for visual display
  const selectedOptionIdsByAttributeId = useMemo(() => {
    const combined: Record<number, Set<number>> = {};

    // Add pre-selected options (from existing variants)
    Object.entries(preSelectedOptionIdsByAttributeId).forEach(([attrId, optionSet]) => {
      const attrIdNum = parseInt(attrId, 10);

      combined[attrIdNum] = new Set(optionSet);
    });

    // Add user-selected options
    Object.entries(userSelectedOptionIdsByAttributeId).forEach(([attrId, optionSet]) => {
      const attrIdNum = parseInt(attrId, 10);

      if (!combined[attrIdNum]) {
        combined[attrIdNum] = new Set();
      }
      optionSet.forEach((optionId) => combined[attrIdNum].add(optionId));
    });

    return combined;
  }, [preSelectedOptionIdsByAttributeId, userSelectedOptionIdsByAttributeId]);

  // #region Data Fetching
  const { data: variants, isLoading: isLoadingVariants } = useGetAllProductVariants(
    {
      'productId.equals': productId!,
      size: 1000,
      sort: ['sku,asc'],
    },
    {
      query: { enabled: !!productId },
    }
  );

  useEffect(() => {
    setEditingRowData(null);
  }, []);

  const { data: configAttributes } = useGetAllSystemConfigAttributes(
    {
      'systemConfigId.equals': variantConfigId!,
      size: 1000,
      sort: ['sortOrder,asc'],
    },
    {
      query: { enabled: !!variantConfigId },
    }
  );

  const variantIds = useMemo(
    () =>
      (variants ?? [])
        .map((variant) => variant.id!)
        .filter((id): id is number => typeof id === 'number'),
    [variants]
  );

  const { data: variantSelections, isLoading: isLoadingSelections } =
    useGetAllProductVariantSelections(
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
    () =>
      (configAttributes ?? []).filter(
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
        { query: { enabled: !!attr.id } }
      )
    ),
  });

  // Initialize pre-selected options based on existing variant selections for visual indication
  useEffect(() => {
    if (variantSelections && variantSelections.length > 0) {
      const initialSelectedOptions: Record<number, Set<number>> = {};

      variantSelections.forEach((selection) => {
        const attributeId = selection.attribute?.id;
        const optionId = selection.option?.id;

        if (typeof attributeId === 'number' && typeof optionId === 'number') {
          if (!initialSelectedOptions[attributeId]) {
            initialSelectedOptions[attributeId] = new Set<number>();
          }
          initialSelectedOptions[attributeId].add(optionId);
        }
      });

      setPreSelectedOptionIdsByAttributeId(initialSelectedOptions);
      // Reset user selections when existing variants are loaded
      setUserSelectedOptionIdsByAttributeId({});
    }
  }, [variantSelections]);

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

  const buildSizeSortKey = (selections: VariantSelection[]) => {
    const sizeSelection = selections.find((selection) => {
      const meta = attributeById.get(selection.attributeId);
      return isSizeLabel(selection.attributeLabel) || isSizeLabel(meta?.label) || isSizeLabel(meta?.name);
    });

    if (!sizeSelection) {
      return null;
    }

    const rawValue = sizeSelection.optionLabel || sizeSelection.optionCode || '';
    const normalized = normalizeSizeToken(rawValue);
    if (!normalized) {
      return { rank: Number.MAX_SAFE_INTEGER, label: rawValue };
    }

    const rank = sizeRankByToken.get(normalized);
    if (rank !== undefined) {
      return { rank, label: rawValue };
    }

    const numeric = Number.parseFloat(normalized);
    if (!Number.isNaN(numeric)) {
      return { rank: 1000 - numeric, label: rawValue };
    }

    return { rank: 999, label: rawValue };
  };

  const sortVariantsBySize = <T extends { selections: VariantSelection[] }>(variants: T[]) => {
    return variants
      .map((variant, index) => ({
        variant,
        index,
        sortKey: buildSizeSortKey(variant.selections),
      }))
      .sort((a, b) => {
        if (!a.sortKey || !b.sortKey) {
          return a.index - b.index;
        }
        const diff = a.sortKey.rank - b.sortKey.rank;
        if (diff !== 0) return diff;
        return a.index - b.index;
      })
      .map((item) => item.variant);
  };

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
              attributeLabel:
                attrMeta?.label ?? s.attribute?.label ?? s.attribute?.name ?? 'Attribute',
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
          isPrimary: variant.isPrimary,
          selections: rowSelections,
        };
      });
  }, [variants, selectionsByVariantId, optionLabelById, attributeById]);

  const upgradeCandidate = useMemo(() => {
    if (!productId) return null;
    if (existingVariantRows.length !== 1) return null;

    const existing = existingVariantRows[0];
    const selectedEntries = Object.entries(selectedOptionIdsByAttributeId)
      .map(([attrId, optionSet]) => ({
        attributeId: Number(attrId),
        optionIds: Array.from(optionSet),
      }))
      .filter((entry) => entry.optionIds.length > 0);

    if (selectedEntries.length === 0) return null;
    if (selectedEntries.some((entry) => entry.optionIds.length !== 1)) return null;

    for (const selection of existing.selections) {
      const currentSet = selectedOptionIdsByAttributeId[selection.attributeId];

      if (!currentSet || !currentSet.has(selection.optionId)) {
        return null;
      }
    }

    const existingAttributeIds = new Set(existing.selections.map((sel) => sel.attributeId));
    const missingEntries = selectedEntries.filter(
      (entry) => !existingAttributeIds.has(entry.attributeId)
    );

    if (missingEntries.length === 0) return null;

    const missingSelections: VariantSelection[] = missingEntries.map((entry) => {
      const optionId = entry.optionIds[0];
      const optionMeta = optionById.get(optionId);
      const attrMeta = attributeById.get(entry.attributeId);

      return {
        attributeId: entry.attributeId,
        attributeLabel: attrMeta?.label ?? attrMeta?.name ?? 'Attribute',
        optionId,
        optionLabel: optionMeta?.label ?? '',
        optionCode: optionMeta?.code,
      };
    });

    return {
      ...existing,
      selections: [...existing.selections, ...missingSelections],
    };
  }, [productId, existingVariantRows, selectedOptionIdsByAttributeId, optionById, attributeById]);

  const displayExistingVariantRows = useMemo(() => {
    if (upgradeCandidate) {
      return [upgradeCandidate];
    }

    return existingVariantRows;
  }, [existingVariantRows, upgradeCandidate]);

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

    if (upgradeCandidate) {
      const parts = upgradeCandidate.selections.map((sel) => ({
        attributeId: sel.attributeId,
        optionId: sel.optionId,
      }));

      if (parts.length > 0) {
        set.add(buildCombinationKey(parts));
      }
    }

    return set;
  }, [selectionsByVariantId, buildCombinationKey, upgradeCandidate]);

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

    const basePrefixRaw = (productName.substring(0, 4) || 'PROD').toUpperCase();
    const basePrefix = normalizeSku(basePrefixRaw, 'PROD');

    const selectionsForCrossProduct = enumAttributeOptions
      .map(({ attribute, options }) => ({
        attribute,
        selectedOptions: options.filter(
          (o) =>
            typeof o.id === 'number' && selectedOptionIdsByAttributeId[attribute.id!]?.has(o.id!)
        ),
      }))
      .filter(({ attribute }) => typeof attribute.id === 'number' && attribute.id)
      .filter((x) => x.selectedOptions.length > 0);

    if (selectionsForCrossProduct.length === 0) return [];

    const newVariants: DraftVariantRow[] = [];
    const sortedAttributes = [...selectionsForCrossProduct].sort(
      (a, b) =>
        (attributeOrderMap.get(a.attribute.id!) ?? 999) -
        (attributeOrderMap.get(b.attribute.id!) ?? 999)
    );

    function generate(index: number, current: VariantSelection[]) {
      if (index === sortedAttributes.length) {
        const isColorAttribute = (attributeId: number, attributeLabel?: string) => {
          const attrMeta = attributeById.get(attributeId);
          const rawName =
            attrMeta?.name ??
            attrMeta?.label ??
            attributeLabel ??
            '';
          return rawName.toLowerCase() === 'color';
        };

        const resolveSkuToken = (selection: VariantSelection) => {
          if (isColorAttribute(selection.attributeId, selection.attributeLabel)) {
            return selection.optionLabel;
          }

          return selection.optionCode ?? selection.optionLabel;
        };

        const cleanToken = (token: string | undefined) => {
          if (!token) return token;
          return token.startsWith('#') ? token.substring(1) : token;
        };
        const skuParts = [
          basePrefix,
          ...current.map((sel) => cleanToken(resolveSkuToken(sel))).filter(Boolean),
        ];
        const sku = normalizeSku(skuParts.join('-'), basePrefix);
        const key = buildCombinationKey(
          current.map((s) => ({ attributeId: s.attributeId, optionId: s.optionId }))
        );

        const variant = {
          key,
          sku,
          price: defaultVariantPrice ?? 1,
          stockQuantity: 0,
          status: defaultGeneratedStatus,
          isPrimary: false,
          imageFiles: createEmptyImageFiles(),
          selections: current,
        };

        if (!existingSkus.has(sku) && !existingCombinationKeys.has(key)) {
          newVariants.push(variant);
        }

        // Only generate truly new variants, skip duplicates entirely
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

    return { newVariants, duplicateVariants: [] };
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
    defaultVariantPrice,
  ]);

  useEffect(() => {
    setDraftVariantsByKey((prev) => {
      const next: Record<string, DraftVariantRow> = {};

      // Add new variants only (duplicates are excluded)
      draftCombinations.newVariants?.forEach((row) => {
        const existing = prev[row.key];
        const merged = existing ? { ...row, ...existing } : row;

        if (
          (merged.price === undefined || merged.price === null || merged.price === 1) &&
          row.price !== undefined &&
          row.price !== 1
        ) {
          merged.price = row.price;
        }

        next[row.key] = { ...merged, isDuplicate: false };
      });

      // Basic check to prevent re-render if only references changed
      if (JSON.stringify(Object.keys(prev)) === JSON.stringify(Object.keys(next))) {
        return prev;
      }

      return next;
    });
  }, [draftCombinations]);

  const draftVariants = useMemo(() => Object.values(draftVariantsByKey), [draftVariantsByKey]);
  const newDraftVariants = useMemo(
    () => draftVariants.filter((v) => !v.isDuplicate),
    [draftVariants]
  );
  const duplicateDraftVariants = useMemo(
    () => draftVariants.filter((v) => v.isDuplicate),
    [draftVariants]
  );
  // #endregion

  const precomputeDisabledOptionIds = useMemo(() => {
    const disabledOptions = new Set<number>();

    // Collect all currently selected attribute options from state (for duplicate prevention)
    const currentSelectedAttributeOptions: Array<{ attributeId: number; optionId: number }> = [];

    Object.entries(selectedOptionIdsByAttributeId).forEach(([attrIdStr, optionIdSet]) => {
      const attributeId = parseInt(attrIdStr, 10);

      optionIdSet.forEach((optionId) => {
        currentSelectedAttributeOptions.push({ attributeId, optionId });
      });
    });

    // For each attribute that has ENUM options
    enumAttributeOptions.forEach(({ attribute, options }) => {
      const currentAttributeId = attribute.id!;

      // For each option in that attribute
      options.forEach((option) => {
        const currentOptionId = option.id!;

        // If this option is already selected for its attribute, it should NOT be disabled.
        // This mechanism is for preventing *new* selections that lead to duplicates.
        if (selectedOptionIdsByAttributeId[currentAttributeId]?.has(currentOptionId)) {
          return;
        }

        // Create a hypothetical set of selections if this option were chosen
        const hypotheticalSelections = [
          // All currently selected options from *other* attributes
          ...currentSelectedAttributeOptions.filter((s) => s.attributeId !== currentAttributeId),
          // Plus the current option being evaluated
          { attributeId: currentAttributeId, optionId: currentOptionId },
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
  const primarySelection = useMemo(() => {
    const draftPrimary = newDraftVariants.find((variant) => variant.isPrimary)?.key;
    if (draftPrimary) {
      return { kind: 'draft' as const, key: draftPrimary };
    }

    if (editingRowData?.isPrimary) {
      return { kind: 'existing' as const, key: String(editingRowData.id) };
    }

    const existingPrimary = displayExistingVariantRows.find((variant) => variant.isPrimary)?.id;
    if (existingPrimary) {
      return { kind: 'existing' as const, key: String(existingPrimary) };
    }

    return null;
  }, [newDraftVariants, editingRowData, displayExistingVariantRows]);

  const combinedRows = useMemo(() => {
    const sortedNewDrafts = sortVariantsBySize(newDraftVariants);
    const sortedDuplicateDrafts = sortVariantsBySize(duplicateDraftVariants);
    const sortedExistingRows = sortVariantsBySize(displayExistingVariantRows);

    return [
      ...sortedNewDrafts.map((d) => ({
        kind: 'draft' as const,
        rowKey: `draft-${d.key}`,
        row: {
          ...d,
          isPrimary:
            primarySelection?.kind === 'draft'
              ? d.key === primarySelection.key
              : Boolean(d.isPrimary) && !primarySelection,
        },
      })),
      ...sortedDuplicateDrafts.map((d) => ({
        kind: 'duplicate' as const,
        rowKey: `duplicate-${d.key}`,
        row: d,
      })),
      ...sortedExistingRows.map((e) => ({
        kind: 'existing' as const,
        rowKey: `existing-${e.id}`,
        row: {
          ...e,
          isPrimary:
            primarySelection?.kind === 'existing'
              ? String(e.id) === primarySelection.key
              : Boolean(e.isPrimary) && !primarySelection,
        },
      })),
    ];
  }, [
    newDraftVariants,
    duplicateDraftVariants,
    displayExistingVariantRows,
    primarySelection,
    attributeById,
  ]);

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

  const canApplySelections =
    missingRequiredEnumAttributes.length === 0 && !isLoadingSelections && !isLoadingOptions;

  // #region Variant Validation
  /**
   * Validates a single variant for required fields
   */
  const validateVariant = (variant: DraftVariantRow): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Price validation: must be defined and greater than 0
    if (variant.price === undefined || variant.price === null) {
      errors.push('Price is required');
    } else if (variant.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    // Stock validation: must be defined and non-negative
    if (variant.stockQuantity === undefined || variant.stockQuantity === null) {
      errors.push('Stock is required');
    } else if (variant.stockQuantity < 0) {
      errors.push('Stock cannot be negative');
    }

    return { isValid: errors.length === 0, errors };
  };

  /**
   * Validates all draft variants and returns a map of errors by row key
   */
  const variantValidationErrors = useMemo(() => {
    const errors: Record<string, string[]> = {};

    newDraftVariants.forEach((variant) => {
      const validation = validateVariant(variant);
      if (!validation.isValid) {
        errors[`draft-${variant.key}`] = validation.errors;
      }
    });

    return errors;
  }, [newDraftVariants]);

  const hasValidationErrors = Object.keys(variantValidationErrors).length > 0;
  // #endregion

  // #endregion

  // #region Mutations & Handlers (moved up for auto-save useEffect)
  const updateVariantMutation = useUpdateProductVariant();
  const deleteVariantMutation = useDeleteProductVariant();

  // #region Handle variants for product save
  useEffect(() => {
    if (isViewMode || !form) return;

    const variantsForForm: ProductVariantDTO[] = [];

    // Check for validation errors before allowing submission
    if (hasValidationErrors) {
      form.setValue('variants', undefined, { shouldValidate: false, shouldDirty: false });
      toast.error(
        `Cannot save product: ${Object.keys(variantValidationErrors).length} variant(s) have validation errors. Please fill in all required fields.`
      );
      return;
    }

    if (newDraftVariants.length > 0 && canApplySelections) {
      variantsForForm.push(
        ...newDraftVariants.map((variant) => ({
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          status: 'ACTIVE',
          isPrimary: variant.isPrimary ?? false,
          imageFiles: variant.imageFiles,
          selections: variant.selections.map((sel) => ({
            status: 'ACTIVE',
            attribute: { id: sel.attributeId },
            option: { id: sel.optionId },
          })),
        }))
      );
    }

    if (upgradeCandidate && canApplySelections) {
      variantsForForm.push({
        id: upgradeCandidate.id,
        sku: upgradeCandidate.sku,
        price: upgradeCandidate.price,
        stockQuantity: upgradeCandidate.stockQuantity,
        status: upgradeCandidate.status,
        isPrimary: upgradeCandidate.isPrimary ?? false,
        selections: upgradeCandidate.selections.map((sel) => ({
          status: 'ACTIVE',
          attribute: { id: sel.attributeId },
          option: { id: sel.optionId },
        })),
      });
    }

    if (variantsForForm.length > 0) {
      form.setValue('variants', variantsForForm, { shouldValidate: false, shouldDirty: false });

      if (newDraftVariants.length > 0) {
        toast.success(
          `${newDraftVariants.length} variant(s) will be created when you save the product`
        );
      }
    } else {
      form.setValue('variants', undefined, { shouldValidate: false, shouldDirty: false });
    }
  }, [isViewMode, newDraftVariants, form, canApplySelections, upgradeCandidate, hasValidationErrors, variantValidationErrors]);
  // #endregion

  // #region Mutations & Handlers (continued)

  const invalidateVariantQueries = () => {
    return queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === '/api/product-variants' ||
        query.queryKey[0] === '/api/product-variant-selections',
    });
  };

  const handleUpdateEditingRow = (updatedValues: Partial<ExistingVariantRow>) => {
    if (!editingRowData) return;
    if (updatedValues.isPrimary) {
      setDraftVariantsByKey((prev) => {
        const next: Record<string, DraftVariantRow> = {};
        Object.entries(prev).forEach(([key, value]) => {
          next[key] = value.isPrimary ? { ...value, isPrimary: false } : value;
        });
        return next;
      });
    }
    setEditingRowData((prev) => (prev ? { ...prev, ...updatedValues } : null));
  };

  const handleSaveExisting = async () => {
    if (!editingRowData) return;

    if (editingRowData.isPrimary) {
      const otherPrimaries = existingVariantRows.filter(
        (variant) => variant.isPrimary && variant.id !== editingRowData.id
      );

      for (const variant of otherPrimaries) {
        await updateVariantMutation.mutateAsync({
          id: variant.id,
          data: {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stockQuantity: variant.stockQuantity,
            status: variant.status,
            isPrimary: false,
            product: productId ? { id: productId } : undefined,
          },
        });
      }
    }

    const payload: ProductVariantDTO = {
      id: editingRowData.id,
      sku: normalizeSku(editingRowData.sku, 'PROD'),
      price: editingRowData.price,
      stockQuantity: editingRowData.stockQuantity,
      status: editingRowData.status,
      isPrimary: editingRowData.isPrimary ?? false,
      product: productId ? { id: productId } : undefined,
    };

    toast.promise(
      updateVariantMutation.mutateAsync({
        id: editingRowData.id,
        data: payload,
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

  const handleDeleteRow = (row: ExistingVariantRow) => {
    toast.promise(
      deleteVariantMutation.mutateAsync({
        id: row.id,
      }),
      {
        loading: 'Deleting variant...',
        success: async () => {
          await invalidateVariantQueries();

          return 'Variant deleted successfully.';
        },
        error: (err) => `Failed to delete: ${err.message}`,
      }
    );
  };

  const toggleOption = (attributeId: number, optionId: number) => {
    setUserSelectedOptionIdsByAttributeId((prev) => {
      const next = { ...prev };
      const currentSet = new Set(next[attributeId] ?? []);

      if (currentSet.has(optionId)) currentSet.delete(optionId);
      else currentSet.add(optionId);
      next[attributeId] = currentSet;

      return next;
    });
  };

  const updateDraft = (key: string, updatedValues: Partial<DraftVariantRow>) => {
    setDraftVariantsByKey((prev) => ({
      ...Object.fromEntries(
        Object.entries(prev).map(([rowKey, row]) => [
          rowKey,
          updatedValues.isPrimary && rowKey !== key ? { ...row, isPrimary: false } : row,
        ])
      ),
      [key]: { ...prev[key], ...updatedValues },
    }));
  };

  // #endregion

  if (!variantConfigId) {
    return <NoVariantConfigPlaceholder />;
  }

  return (
    <div className="space-y-6">
      {/* Only show variant generator in non-view modes */}
      {!isViewMode && (
        <VariantGenerator
          newVariantsCount={newDraftVariants.length}
          duplicateVariantsCount={duplicateDraftVariants.length}
          missingRequiredEnumAttributes={missingRequiredEnumAttributes}
          isLoadingSelections={isLoadingSelections}
          enumAttributeOptions={enumAttributeOptions}
          selectedOptionIdsByAttributeId={selectedOptionIdsByAttributeId}
          visibleEnumAttributes={visibleEnumAttributes}
          onToggleOption={toggleOption}
          disabledOptionIds={precomputeDisabledOptionIds}
          isCreateMode={!productId}
        />
      )}

      {/* Show variants table in all modes, but make it read-only in view mode */}
      <VariantsTable
        rows={combinedRows}
        existingVariantRows={existingVariantRows}
        draftVariants={draftVariants}
        visibleEnumAttributes={visibleEnumAttributes}
        productName={productName}
        existingSkus={existingSkus}
        onUpdateDraft={updateDraft}
        editingRowData={editingRowData}
        onEditRow={setEditingRowData}
        onUpdateEditingRow={handleUpdateEditingRow}
        onSaveExisting={handleSaveExisting}
        onCancelEdit={() => setEditingRowData(null)}
        onDeleteRow={handleDeleteRow}
        isLoading={isLoadingVariants || isLoadingSelections}
        isViewMode={isViewMode}
        selection={selection}
        validationErrors={variantValidationErrors}
      />
    </div>
  );
}
