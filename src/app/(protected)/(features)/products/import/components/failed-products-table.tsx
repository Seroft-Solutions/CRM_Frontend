'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type {
  ImportHistoryDTO,
  ProductDTO,
  ProductCategoryDTO,
  ProductSubCategoryDTO,
  SystemConfigDTO,
  SystemConfigAttributeDTO,
  SystemConfigAttributeOptionDTO,
} from '@/core/api/generated/spring/schemas';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import {
  useDeleteAllImportHistoryEntries,
  useGetAllImportHistories,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { useGetAllProductCategories } from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import { useGetAllProductSubCategories } from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const PRODUCT_CODE_REGEX = /^[A-Za-z0-9_-]{2,20}$/;
const EMPTY_SELECT_VALUE = '__none__';
const SYSTEM_CONFIG_LABEL = 'System Config';

const BASE_HEADERS = [
  'Product Category',
  'Product Sub Category',
  'Product Name',
  'Product code',
  'Article Number',
  'Description',
  'Total Quantity',
  'Base Price',
  'Discounted Price',
  'Sale Price',
  SYSTEM_CONFIG_LABEL,
];

const TRAILING_HEADERS = ['Variant Price', 'Variant Stock'];

const REMARK_HEADERS = [
  'Product Category',
  'Product Sub Category',
  'Product Name',
  'Product code',
  'Article Number',
  'Description',
  'Total Quantity',
  'Base Price',
  'Discounted Price',
  'Sale Price',
  'Variant Price',
  'Variant Stock',
];

const NUMBER_HEADERS = new Set(['Total Quantity', 'Variant Stock']);
const PRICE_HEADERS = new Set(['Base Price', 'Discounted Price', 'Sale Price', 'Variant Price']);

type VariantAttributeValues = Record<string, string>;
type ParsedVariantAttributes = {
  values: VariantAttributeValues;
  labels: Record<string, string>;
  systemConfigKey?: string;
};

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeSystemConfigKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLowerCase();
}

function parseVariantAttributes(value: string | null | undefined): ParsedVariantAttributes {
  const values: VariantAttributeValues = {};
  const labels: Record<string, string> = {};
  let systemConfigKey: string | undefined;

  if (!hasText(value)) return { values, labels, systemConfigKey };

  value.split(',').forEach((part) => {
    const [rawKey, ...rest] = part.split(':');
    const trimmedKey = (rawKey ?? '').trim();
    const rawValue = rest.join(':').trim();

    if (!hasText(trimmedKey) || !hasText(rawValue)) return;

    const normalized = normalizeKey(trimmedKey);

    if (!normalized) return;
    if (normalized === normalizeKey(SYSTEM_CONFIG_LABEL)) {
      systemConfigKey = rawValue;

      return;
    }
    values[normalized] = rawValue;
    labels[normalized] = trimmedKey;
  });

  return { values, labels, systemConfigKey };
}

function parseRemarkData(rawRemark: string | null | undefined): Record<string, string> {
  if (!hasText(rawRemark)) return {};
  try {
    const parsed = JSON.parse(rawRemark);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const values: Record<string, string> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (!hasText(key) || value == null) return;
      values[key] = String(value);
    });

    return values;
  } catch (error) {
    console.warn('Failed to parse remark data:', error);

    return {};
  }
}

function buildRemarkData(
  current: Record<string, string>,
  updates: Record<string, string | null | undefined>
): string | null {
  const next: Record<string, string> = { ...current };

  Object.entries(updates).forEach(([key, value]) => {
    if (!hasText(key)) return;
    if (!hasText(value)) {
      delete next[key];

      return;
    }
    next[key] = value.trim();
  });
  const entries = Object.entries(next).filter(([, value]) => hasText(value));

  if (!entries.length) return null;
  const normalized: Record<string, string> = {};

  entries.forEach(([key, value]) => {
    normalized[key] = value.trim();
  });

  return JSON.stringify(normalized);
}

function resolveRowField(
  row: ImportHistoryDTO,
  remarkData: Record<string, string>,
  header: string,
  fallback?: string | null
): string {
  if (header === 'Product Name') {
    return (row.productName ?? remarkData[header] ?? fallback ?? '') as string;
  }
  if (header === 'Product code') {
    return (row.productCode ?? remarkData[header] ?? fallback ?? '') as string;
  }

  return (remarkData[header] ?? fallback ?? '') as string;
}

function buildVariantAttributes(
  values: VariantAttributeValues,
  labelByKey: Map<string, string>,
  fallbackLabels: Record<string, string>,
  systemConfigKey?: string | null
): string {
  const parts: string[] = [];

  if (hasText(systemConfigKey)) {
    parts.push(`${SYSTEM_CONFIG_LABEL}:${systemConfigKey.trim()}`);
  }
  Object.keys(values)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      const value = values[key];

      if (!hasText(value)) return;
      const label = labelByKey.get(key) ?? fallbackLabels[key] ?? key;

      parts.push(`${label}:${value.trim()}`);
    });

  return parts.join(',');
}

function isProductImportHistoryRow(row: ImportHistoryDTO): boolean {
  const hasIssue = hasText(row.issue);

  if (!hasIssue) return false;
  if (isDuplicateProductCodeIssue(row.issue)) return false;

  if (row.entityName) {
    return row.entityName.toUpperCase() === 'PRODUCT';
  }

  const hasProductSignals =
    hasText(row.productName) || hasText(row.productCode) || hasText(row.variantAttributes);
  const hasNonProductSignals =
    hasText(row.callType) ||
    hasText(row.subCallType) ||
    hasText(row.priority) ||
    hasText(row.callStatus) ||
    hasText(row.externalId);

  return hasProductSignals && !hasNonProductSignals;
}

function isDuplicateProductCodeIssue(issue: string | null | undefined): boolean {
  if (!hasText(issue)) return false;
  const normalized = issue.toLowerCase();

  return (
    normalized.includes('duplicate product code') ||
    (normalized.includes('product with code') &&
      normalized.includes('already exists') &&
      normalized.includes('skipping'))
  );
}

function formatOptionLabel(option: SystemConfigAttributeOptionDTO): string {
  if (option.label && option.code && option.label !== option.code) {
    return `${option.label} (${option.code})`;
  }

  return option.label || option.code;
}

function formatCategoryLabel(category: ProductCategoryDTO): string {
  if (category.name && category.code && category.name !== category.code) {
    return `${category.name} (${category.code})`;
  }

  return category.name || category.code || '';
}

function formatSubCategoryLabel(subCategory: ProductSubCategoryDTO): string {
  const name = subCategory.name || subCategory.code || '';
  const categoryLabel = subCategory.category?.name || subCategory.category?.code || '';

  if (categoryLabel) {
    return `${name} — ${categoryLabel}`;
  }

  return name;
}

function resolveCategoryOptionValue(category: ProductCategoryDTO): string {
  if (hasText(category.code)) {
    return category.code!;
  }
  if (hasText(category.name)) {
    return category.name!;
  }

  return '';
}

function resolveSubCategoryOptionValue(subCategory: ProductSubCategoryDTO): string {
  if (hasText(subCategory.code)) {
    return subCategory.code!;
  }
  if (hasText(subCategory.name)) {
    return subCategory.name!;
  }

  return '';
}

async function processProductImportHistory(
  id: number,
  payload: ImportHistoryDTO
): Promise<ProductDTO> {
  return springServiceMutator<ProductDTO>({
    url: `/api/import-histories/${id}/process-product`,
    method: 'POST',
    data: payload,
  });
}

export function FailedProductsTable() {
  const [editableRows, setEditableRows] = useState<ImportHistoryDTO[]>([]);
  const [pendingRowIds, setPendingRowIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [fallbackSystemConfigKey, setFallbackSystemConfigKey] = useState<string | null>(null);
  const [templateHeaders, setTemplateHeaders] = useState<string[] | null>(null);

  const {
    data: importHistoryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllImportHistories(
    { page: 0, size: 1000, sort: ['id,desc'] },
    {
      query: {
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
        keepPreviousData: false,
      },
    }
  );

  const { data: systemConfigsData = [] } = useGetAllSystemConfigs(
    { page: 0, size: 1000, 'status.equals': 'ACTIVE', 'systemConfigType.equals': 'PRODUCT' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );
  const systemConfigs = systemConfigsData as SystemConfigDTO[];

  const { data: productCategories = [] } = useGetAllProductCategories(
    { page: 0, size: 1000, 'status.equals': 'ACTIVE' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const { data: productSubCategories = [] } = useGetAllProductSubCategories(
    { page: 0, size: 2000, 'status.equals': 'ACTIVE' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  useEffect(() => {
    const storedHeaders = sessionStorage.getItem('productImportColumns');

    if (!storedHeaders) return;
    try {
      const headers = JSON.parse(storedHeaders);

      if (Array.isArray(headers) && headers.length > 0) {
        setTemplateHeaders(headers);
      }
    } catch (error) {
      console.error('Failed to parse import column headers:', error);
    }
  }, []);

  useEffect(() => {
    if (!systemConfigs.length) return;
    const storedId = sessionStorage.getItem('productImportSystemConfigId');

    if (!storedId) return;
    const parsedId = Number(storedId);

    if (!Number.isFinite(parsedId)) return;
    const match = systemConfigs.find((config) => config.id === parsedId);

    if (match?.configKey) {
      setFallbackSystemConfigKey(match.configKey);
    }
  }, [systemConfigs]);

  const { data: allAttributes } = useGetAllSystemConfigAttributes(
    { size: 1000, 'status.equals': 'ACTIVE' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const systemConfigByKey = useMemo(() => {
    const map = new Map<string, { id: number; configKey: string }>();

    systemConfigs.forEach((config) => {
      if (typeof config.id !== 'number' || !hasText(config.configKey)) return;
      map.set(normalizeSystemConfigKey(config.configKey), {
        id: config.id,
        configKey: config.configKey,
      });
    });

    return map;
  }, [systemConfigs]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, ProductCategoryDTO>();

    productCategories.forEach((category) => {
      if (!category) return;
      if (hasText(category.code)) {
        map.set(normalizeLookupValue(category.code), category);
      }
      if (hasText(category.name)) {
        map.set(normalizeLookupValue(category.name), category);
      }
    });

    return map;
  }, [productCategories]);

  const categoryOptions = useMemo(() => {
    const options = productCategories
      .filter((category) => category && (hasText(category.code) || hasText(category.name)))
      .map((category) => category as ProductCategoryDTO);

    options.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));

    return options;
  }, [productCategories]);

  const subCategoryLookup = useMemo(() => {
    const map = new Map<string, ProductSubCategoryDTO>();

    productSubCategories.forEach((subCategory) => {
      if (!subCategory) return;
      if (hasText(subCategory.code)) {
        map.set(normalizeLookupValue(subCategory.code), subCategory);
      }
      if (hasText(subCategory.name)) {
        map.set(normalizeLookupValue(subCategory.name), subCategory);
      }
    });

    return map;
  }, [productSubCategories]);

  const subCategoriesByCategoryId = useMemo(() => {
    const map = new Map<number, ProductSubCategoryDTO[]>();

    productSubCategories.forEach((subCategory) => {
      const categoryId = subCategory.category?.id;

      if (typeof categoryId !== 'number') return;
      const list = map.get(categoryId) ?? [];

      list.push(subCategory);
      map.set(categoryId, list);
    });
    map.forEach((list) =>
      list.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''))
    );

    return map;
  }, [productSubCategories]);

  const relevantConfigIds = useMemo(() => {
    const ids = new Set<number>();

    editableRows.forEach((row) => {
      const parsed = parseVariantAttributes(row.variantAttributes);

      if (!hasText(parsed.systemConfigKey)) return;
      const config = systemConfigByKey.get(normalizeSystemConfigKey(parsed.systemConfigKey));

      if (config) {
        ids.add(config.id);
      }
    });

    return ids;
  }, [editableRows, systemConfigByKey]);

  const relevantAttributes = useMemo(() => {
    const attributes = allAttributes ?? [];

    if (relevantConfigIds.size === 0) {
      return attributes;
    }

    return attributes.filter((attr) => {
      const configId = attr.systemConfig?.id;

      return typeof configId === 'number' && relevantConfigIds.has(configId);
    });
  }, [allAttributes, relevantConfigIds]);

  const attributeIds = useMemo(
    () =>
      relevantAttributes
        .map((attr) => attr.id)
        .filter((id): id is number => typeof id === 'number'),
    [relevantAttributes]
  );

  const { data: attributeOptions } = useGetAllSystemConfigAttributeOptions(
    {
      'attributeId.in': attributeIds,
      'status.equals': 'ACTIVE',
      size: 2000,
      sort: ['sortOrder,asc'],
    },
    { query: { enabled: attributeIds.length > 0, staleTime: 5 * 60 * 1000 } }
  );

  const attributesByConfigId = useMemo(() => {
    const map = new Map<number, SystemConfigAttributeDTO[]>();

    relevantAttributes.forEach((attr) => {
      const configId = attr.systemConfig?.id;

      if (typeof configId !== 'number') return;
      const list = map.get(configId) ?? [];

      list.push(attr);
      map.set(configId, list);
    });
    map.forEach((list) => list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));

    return map;
  }, [relevantAttributes]);

  const attributeLabelData = useMemo(() => {
    const labelByKey = new Map<string, string>();
    const orderedKeys: string[] = [];

    if (templateHeaders?.length) {
      const attributeLabels = templateHeaders.filter(
        (header) => !BASE_HEADERS.includes(header) && !TRAILING_HEADERS.includes(header)
      );

      attributeLabels.forEach((label) => {
        const key = normalizeKey(label);

        if (!key || labelByKey.has(key)) return;
        labelByKey.set(key, label);
        orderedKeys.push(key);
      });

      return { orderedKeys, labelByKey };
    }

    const includeConfigAttributes = relevantConfigIds.size > 0;
    const configOrder = includeConfigAttributes
      ? systemConfigs
          .map((config) => config.id)
          .filter((id: unknown): id is number => typeof id === 'number')
          .filter((id) => relevantConfigIds.has(id))
      : [];

    const appendAttribute = (attr: SystemConfigAttributeDTO) => {
      const rawLabel = attr.label ?? attr.name ?? '';
      const key = normalizeKey(rawLabel);

      if (!key || labelByKey.has(key)) return;
      labelByKey.set(key, rawLabel);
      orderedKeys.push(key);
    };

    configOrder.forEach((configId) => {
      (attributesByConfigId.get(configId) ?? []).forEach(appendAttribute);
    });

    if (includeConfigAttributes) {
      attributesByConfigId.forEach((attrs, configId) => {
        if (configOrder.includes(configId)) return;
        attrs.forEach(appendAttribute);
      });
    }

    editableRows.forEach((row) => {
      const parsed = parseVariantAttributes(row.variantAttributes);

      Object.entries(parsed.labels).forEach(([key, label]) => {
        if (labelByKey.has(key)) return;
        labelByKey.set(key, label);
        orderedKeys.push(key);
      });
    });

    return { orderedKeys, labelByKey };
  }, [templateHeaders, systemConfigs, relevantConfigIds, attributesByConfigId, editableRows]);

  const optionsByAttributeId = useMemo(() => {
    const map = new Map<number, SystemConfigAttributeOptionDTO[]>();

    (attributeOptions ?? []).forEach((option) => {
      const attributeId = option.attribute?.id;

      if (typeof attributeId !== 'number') return;
      const list = map.get(attributeId) ?? [];

      list.push(option);
      map.set(attributeId, list);
    });

    return map;
  }, [attributeOptions]);

  const optionsByConfigAndKey = useMemo(() => {
    const map = new Map<number, Map<string, SystemConfigAttributeOptionDTO[]>>();

    relevantAttributes.forEach((attr) => {
      const configId = attr.systemConfig?.id;
      const rawLabel = attr.label ?? attr.name ?? '';
      const key = normalizeKey(rawLabel);

      if (typeof configId !== 'number' || !key || typeof attr.id !== 'number') return;
      const options = optionsByAttributeId.get(attr.id) ?? [];

      if (!map.has(configId)) {
        map.set(configId, new Map());
      }
      map.get(configId)!.set(key, options);
    });

    return map;
  }, [relevantAttributes, optionsByAttributeId]);

  const fallbackOptionsByKey = useMemo(() => {
    const map = new Map<string, SystemConfigAttributeOptionDTO[]>();

    relevantAttributes.forEach((attr) => {
      const rawLabel = attr.label ?? attr.name ?? '';
      const key = normalizeKey(rawLabel);

      if (!key || typeof attr.id !== 'number') return;
      const options = optionsByAttributeId.get(attr.id) ?? [];

      if (!map.has(key)) {
        map.set(key, []);
      }
      const existing = map.get(key)!;

      options.forEach((option) => {
        const token = `${option.code}`.toLowerCase();

        if (existing.some((entry) => `${entry.code}`.toLowerCase() === token)) return;
        existing.push(option);
      });
    });

    return map;
  }, [relevantAttributes, optionsByAttributeId]);

  useEffect(() => {
    const rows = (importHistoryData ?? []).filter(
      (row) => typeof row.id === 'number' && isProductImportHistoryRow(row)
    );

    setEditableRows(rows);
    setPendingRowIds(new Set());
    setRowErrors({});
  }, [importHistoryData]);

  const { mutateAsync: deleteAllImportHistoryEntriesAsync } = useDeleteAllImportHistoryEntries();

  const attributeColumns = useMemo(
    () =>
      attributeLabelData.orderedKeys.map((key) => ({
        key,
        label: attributeLabelData.labelByKey.get(key) ?? key,
      })),
    [attributeLabelData]
  );

  const resolveConfigId = useCallback(
    (systemConfigKey?: string | null) => {
      if (!hasText(systemConfigKey)) return null;
      const config = systemConfigByKey.get(normalizeSystemConfigKey(systemConfigKey));

      return config ? config.id : null;
    },
    [systemConfigByKey]
  );

  const resolveSystemConfigKey = useCallback(
    (systemConfigKey?: string | null) => {
      if (hasText(systemConfigKey)) {
        return systemConfigKey!.trim();
      }
      if (hasText(fallbackSystemConfigKey)) {
        return fallbackSystemConfigKey!.trim();
      }

      return null;
    },
    [fallbackSystemConfigKey]
  );

  const getOptionsForRowAttribute = useCallback(
    (configId: number | null, key: string) => {
      if (typeof configId === 'number') {
        const options = optionsByConfigAndKey.get(configId)?.get(key);

        if (options && options.length) {
          return options;
        }
      }

      return fallbackOptionsByKey.get(key) ?? [];
    },
    [optionsByConfigAndKey, fallbackOptionsByKey]
  );

  const computeRowIssues = useCallback(
    (row: ImportHistoryDTO): string[] => {
      const issues: string[] = [];
      const remarkData = parseRemarkData(row.remark);
      const name = resolveRowField(row, remarkData, 'Product Name').trim();
      const code = resolveRowField(row, remarkData, 'Product code').trim();
      const parsed = parseVariantAttributes(row.variantAttributes);
      const effectiveSystemConfigKey = resolveSystemConfigKey(parsed.systemConfigKey);

      if (name.length < 2 || name.length > 100) {
        issues.push('Product Name must be 2-100 characters.');
      }
      if (!PRODUCT_CODE_REGEX.test(code)) {
        issues.push(
          'Product Code must be 2-20 characters (letters, numbers, underscores, hyphens).'
        );
      }

      const hasAttribute = Object.values(parsed.values).some((value) => hasText(value));
      const totalQuantityRaw = remarkData['Total Quantity'] ?? '';
      const totalQuantityValue = Number.parseInt(totalQuantityRaw, 10);
      const hasTotalQuantity = Number.isFinite(totalQuantityValue) && totalQuantityValue > 0;

      if (!hasAttribute && !hasTotalQuantity) {
        issues.push('Provide at least one variant attribute or a positive Total Quantity.');
      }

      const configId = resolveConfigId(effectiveSystemConfigKey);

      if (hasText(parsed.systemConfigKey) && configId == null) {
        issues.push(`Unknown ${SYSTEM_CONFIG_LABEL} '${parsed.systemConfigKey}'.`);
      }

      if (configId != null) {
        const requiredAttributes = attributesByConfigId.get(configId) ?? [];

        requiredAttributes.forEach((attr) => {
          if (!attr.isRequired) return;
          const key = normalizeKey(attr.label ?? attr.name ?? '');

          if (!key) return;
          if (!hasText(parsed.values[key])) {
            issues.push(`Missing required attribute: ${attr.label ?? attr.name}.`);
          }
        });
      }

      Object.entries(parsed.values).forEach(([key, value]) => {
        if (!hasText(value)) return;
        const options = getOptionsForRowAttribute(configId, key);

        if (!options.length) return;
        const match = options.some(
          (option) =>
            option.code?.toLowerCase() === value.toLowerCase() ||
            option.label?.toLowerCase() === value.toLowerCase()
        );

        if (!match) {
          const label = attributeLabelData.labelByKey.get(key) ?? parsed.labels[key] ?? key;

          issues.push(`${label} value '${value}' is not in system config options.`);
        }
      });

      return issues;
    },
    [
      resolveConfigId,
      resolveSystemConfigKey,
      attributesByConfigId,
      getOptionsForRowAttribute,
      attributeLabelData,
    ]
  );

  const validatedRows = useMemo(() => {
    return editableRows.filter((row) => {
      if (typeof row.id !== 'number') return false;
      if (pendingRowIds.has(row.id)) return false;
      if (rowErrors[row.id]) return false;

      return computeRowIssues(row).length === 0;
    });
  }, [editableRows, pendingRowIds, computeRowIssues, rowErrors]);

  const handleFieldChange = useCallback(
    (rowId: number, field: keyof ImportHistoryDTO, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const nextRow = { ...row, [field]: value } as ImportHistoryDTO;
          const remarkHeader =
            field === 'productName'
              ? 'Product Name'
              : field === 'productCode'
                ? 'Product code'
                : null;

          if (!remarkHeader) {
            return nextRow;
          }
          const remarkData = parseRemarkData(row.remark);
          const nextRemark = buildRemarkData(remarkData, { [remarkHeader]: value });

          return { ...nextRow, remark: nextRemark };
        })
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };

        delete next[rowId];

        return next;
      });
    },
    []
  );

  const handleRemarkFieldChange = useCallback((rowId: number, header: string, value: string) => {
    setEditableRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const remarkData = parseRemarkData(row.remark);
        const nextRemark = buildRemarkData(remarkData, { [header]: value });

        return { ...row, remark: nextRemark };
      })
    );
    setRowErrors((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };

      delete next[rowId];

      return next;
    });
  }, []);

  const handleAttributeChange = useCallback(
    (rowId: number, key: string, label: string, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const parsed = parseVariantAttributes(row.variantAttributes);
          const nextValues = { ...parsed.values };

          if (value === EMPTY_SELECT_VALUE) {
            delete nextValues[key];
          } else {
            nextValues[key] = value;
          }
          const nextLabels = { ...parsed.labels, [key]: label };
          const nextVariantAttributes = buildVariantAttributes(
            nextValues,
            attributeLabelData.labelByKey,
            nextLabels,
            parsed.systemConfigKey
          );

          return { ...row, variantAttributes: nextVariantAttributes };
        })
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };

        delete next[rowId];

        return next;
      });
    },
    [attributeLabelData]
  );

  const handleSystemConfigChange = useCallback(
    (rowId: number, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const parsed = parseVariantAttributes(row.variantAttributes);
          const nextVariantAttributes = buildVariantAttributes(
            parsed.values,
            attributeLabelData.labelByKey,
            parsed.labels,
            value === EMPTY_SELECT_VALUE ? null : value
          );

          return { ...row, variantAttributes: nextVariantAttributes };
        })
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };

        delete next[rowId];

        return next;
      });
    },
    [attributeLabelData]
  );

  const handleCategoryChange = useCallback(
    (rowId: number, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const remarkData = parseRemarkData(row.remark);
          const nextCategoryValue = value === EMPTY_SELECT_VALUE ? null : value;
          const currentSubValue = remarkData['Product Sub Category'];
          let nextSubValue: string | null | undefined = currentSubValue;

          if (!hasText(nextCategoryValue)) {
            nextSubValue = null;
          } else if (hasText(currentSubValue)) {
            const subMatch = subCategoryLookup.get(normalizeLookupValue(currentSubValue));
            const selectedCategory = categoryLookup.get(normalizeLookupValue(nextCategoryValue));

            if (
              subMatch?.category?.id != null &&
              selectedCategory?.id != null &&
              subMatch.category.id !== selectedCategory.id
            ) {
              nextSubValue = null;
            }
          }

          const nextRemark = buildRemarkData(remarkData, {
            'Product Category': nextCategoryValue,
            'Product Sub Category': nextSubValue,
          });

          return { ...row, remark: nextRemark };
        })
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };

        delete next[rowId];

        return next;
      });
    },
    [subCategoryLookup, categoryLookup]
  );

  const handleSubCategoryChange = useCallback(
    (rowId: number, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const remarkData = parseRemarkData(row.remark);
          const nextSubValue = value === EMPTY_SELECT_VALUE ? null : value;
          let nextCategoryValue = remarkData['Product Category'];

          if (hasText(nextSubValue)) {
            const subMatch = subCategoryLookup.get(normalizeLookupValue(nextSubValue));
            const categoryValue = subMatch?.category
              ? resolveCategoryOptionValue(subMatch.category)
              : '';

            if (hasText(categoryValue)) {
              nextCategoryValue = categoryValue;
            }
          }
          const nextRemark = buildRemarkData(remarkData, {
            'Product Category': nextCategoryValue,
            'Product Sub Category': nextSubValue,
          });

          return { ...row, remark: nextRemark };
        })
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };

        delete next[rowId];

        return next;
      });
    },
    [subCategoryLookup]
  );

  const handleSaveRow = useCallback(
    async (row: ImportHistoryDTO): Promise<boolean> => {
      if (typeof row.id !== 'number') return false;
      const issues = computeRowIssues(row);

      if (issues.length) {
        toast.error('Please fix validation errors before saving.');
        setRowErrors((prev) => ({ ...prev, [row.id!]: issues.join(' ') }));

        return false;
      }

      const parsed = parseVariantAttributes(row.variantAttributes);
      const effectiveSystemConfigKey = resolveSystemConfigKey(parsed.systemConfigKey);
      const remarkData = parseRemarkData(row.remark);
      const resolvedName = resolveRowField(row, remarkData, 'Product Name').trim();
      const resolvedCode = resolveRowField(row, remarkData, 'Product code').trim();
      const payload: ImportHistoryDTO = {
        ...row,
        productName: resolvedName,
        productCode: resolvedCode,
        variantAttributes: buildVariantAttributes(
          parsed.values,
          attributeLabelData.labelByKey,
          parsed.labels,
          effectiveSystemConfigKey
        ),
        issue: null,
      };

      setPendingRowIds((prev) => new Set(prev).add(row.id!));

      try {
        await processProductImportHistory(row.id!, payload);
        toast.success(`Created product for row ${row.id}.`);
        setEditableRows((prev) => prev.filter((entry) => entry.id !== row.id));
        refetch();

        return true;
      } catch (e: unknown) {
        const responseData = (e as { response?: { data?: Record<string, unknown> } })?.response
          ?.data as { title?: string; detail?: string; message?: string } | undefined;
        let message =
          responseData?.title ||
          responseData?.detail ||
          responseData?.message ||
          (e as { message?: string })?.message ||
          'Unknown error';

        if (
          typeof responseData?.message === 'string' &&
          responseData.message.startsWith('error.')
        ) {
          message = responseData?.title || message;
        }
        toast.error(`Failed to create product for row ${row.id}: ${message}`);
        setRowErrors((prev) => ({ ...prev, [row.id!]: message }));

        return false;
      } finally {
        setPendingRowIds((prev) => {
          const next = new Set(prev);

          next.delete(row.id!);

          return next;
        });
      }
    },
    [computeRowIssues, refetch, attributeLabelData, resolveSystemConfigKey]
  );

  const handleSaveValidated = useCallback(async () => {
    if (!validatedRows.length) {
      toast.info('No validated rows available to save.');

      return;
    }

    let successCount = 0;

    for (const row of validatedRows) {
      const ok = await handleSaveRow(row);

      if (ok) successCount += 1;
    }

    if (successCount > 0) {
      toast.success(`Created ${successCount} product${successCount === 1 ? '' : 's'}.`);
    }
  }, [validatedRows, handleSaveRow]);

  const handleClearAllFailed = useCallback(async () => {
    if (!editableRows.length) return;
    const confirmed = window.confirm(
      `Delete ${editableRows.length} failed product import entr${editableRows.length === 1 ? 'y' : 'ies'}?`
    );

    if (!confirmed) return;

    try {
      const resp = await deleteAllImportHistoryEntriesAsync({ params: { entityName: 'PRODUCT' } });
      const response = resp as { deletedCount?: number; message?: string };
      const deleted = Number(response?.deletedCount ?? 0);
      const message = typeof response?.message === 'string' ? response.message : undefined;

      if (deleted > 0) {
        toast.success(message ?? `Deleted ${deleted} entr${deleted === 1 ? 'y' : 'ies'}.`);
      } else {
        toast.info(message ?? 'No import history entries found to delete.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';

      toast.error(`Failed to clear failed product import rows: ${message}`);
    } finally {
      refetch();
    }
  }, [editableRows, deleteAllImportHistoryEntriesAsync, refetch]);

  const handleDownloadCorrectedRows = useCallback(() => {
    if (!editableRows.length) {
      toast.info('No failed rows to download.');

      return;
    }

    const sheetRows = editableRows.map((row) => {
      const parsed = parseVariantAttributes(row.variantAttributes);
      const effectiveSystemConfigKey = resolveSystemConfigKey(parsed.systemConfigKey);
      const remarkData = parseRemarkData(row.remark);
      const rowValues: Record<string, string> = {};

      REMARK_HEADERS.forEach((header) => {
        const value = resolveRowField(row, remarkData, header);

        if (hasText(value)) {
          rowValues[header] = value;
        }
      });
      rowValues[SYSTEM_CONFIG_LABEL] =
        effectiveSystemConfigKey ?? rowValues[SYSTEM_CONFIG_LABEL] ?? '';

      attributeColumns.forEach((column) => {
        rowValues[column.label] = parsed.values[column.key] ?? '';
      });

      const headers = templateHeaders?.length
        ? templateHeaders
        : [...BASE_HEADERS, ...attributeColumns.map((column) => column.label), ...TRAILING_HEADERS];

      return [...headers.map((header) => rowValues[header] ?? ''), row.issue ?? ''];
    });

    const headers = templateHeaders?.length
      ? templateHeaders
      : [...BASE_HEADERS, ...attributeColumns.map((column) => column.label), ...TRAILING_HEADERS];
    const worksheet = XLSX.utils.aoa_to_sheet([[...headers, 'Reason'], ...sheetRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Products');
    XLSX.writeFile(workbook, 'product-import-failed-rows.xlsx');
  }, [editableRows, attributeColumns, resolveSystemConfigKey, templateHeaders]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Product Import Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading failed import rows…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Unable to load import history.';

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Failed to load failed product rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-700">{msg}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!editableRows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Product Import Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No failed product import rows found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Failed Product Import Rows</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fix the values and create products. Failed rows are removed after successful creation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadCorrectedRows}>
            Download Corrected Rows
          </Button>
          <Button variant="outline" onClick={handleClearAllFailed}>
            Clear All
          </Button>
          <Button onClick={handleSaveValidated}>Create Products ({validatedRows.length})</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              {BASE_HEADERS.map((header) => (
                <TableHead key={`base-${header}`}>{header}</TableHead>
              ))}
              {attributeColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              {TRAILING_HEADERS.map((header) => (
                <TableHead key={`trail-${header}`}>{header}</TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableRows.map((row) => {
              const rowId = row.id as number;
              const parsed = parseVariantAttributes(row.variantAttributes);
              const effectiveSystemConfigKey = resolveSystemConfigKey(parsed.systemConfigKey);
              const rowConfigId = resolveConfigId(effectiveSystemConfigKey);
              const remarkData = parseRemarkData(row.remark);
              const issues = computeRowIssues(row);
              const errorText = rowErrors[rowId];
              const importIssue = hasText(row.issue) ? row.issue!.trim() : '';
              const rowSaving = pendingRowIds.has(rowId);
              const displayedIssues = [...issues];

              if (errorText && !displayedIssues.includes(errorText)) {
                displayedIssues.push(errorText);
              }

              const issueDetails =
                displayedIssues.length > 0
                  ? displayedIssues
                  : importIssue
                    ? [`Previous import error: ${importIssue}`]
                    : [];
              const issueTitle =
                displayedIssues.length > 0 ? 'Validation Errors:' : 'Import Error:';

              const rowHasInvalid = issues.length > 0;
              const rowNeedsAttention = !rowHasInvalid && Boolean(errorText);
              const isValidated = !rowHasInvalid && !rowNeedsAttention;
              const canSave = !rowHasInvalid && !rowSaving && !errorText;

              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    'transition-colors',
                    rowHasInvalid && 'bg-red-50/40 hover:bg-red-50/50',
                    !rowHasInvalid && rowNeedsAttention && 'bg-amber-50/80 hover:bg-amber-50/90',
                    isValidated && 'bg-green-100/60 hover:bg-green-100/70'
                  )}
                >
                  <TableCell>{rowId}</TableCell>
                  {BASE_HEADERS.map((header) => {
                    if (header === 'Product Category') {
                      const currentValue = resolveRowField(row, remarkData, header);
                      const categoryMatch = hasText(currentValue)
                        ? categoryLookup.get(normalizeLookupValue(currentValue))
                        : undefined;
                      const resolvedCategoryValue = categoryMatch
                        ? resolveCategoryOptionValue(categoryMatch)
                        : '';
                      const selectValue =
                        resolvedCategoryValue ||
                        (hasText(currentValue) ? currentValue : EMPTY_SELECT_VALUE);
                      const showCustom = hasText(currentValue) && !categoryMatch;

                      return (
                        <TableCell key={`${rowId}-${header}`} className="min-w-[200px]">
                          <Select
                            value={selectValue}
                            onValueChange={(value) => handleCategoryChange(rowId, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Product Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>None</SelectItem>
                              {showCustom && (
                                <SelectItem value={currentValue}>
                                  Current: {currentValue}
                                </SelectItem>
                              )}
                              {categoryOptions.length === 0 ? (
                                <SelectItem value="__empty__" disabled>
                                  No Product Categories available
                                </SelectItem>
                              ) : (
                                categoryOptions.map((category) => (
                                  <SelectItem
                                    key={category.id ?? category.code ?? category.name}
                                    value={resolveCategoryOptionValue(category)}
                                  >
                                    {formatCategoryLabel(category)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    }
                    if (header === 'Product Sub Category') {
                      const currentValue = resolveRowField(row, remarkData, header);
                      const subCategoryMatch = hasText(currentValue)
                        ? subCategoryLookup.get(normalizeLookupValue(currentValue))
                        : undefined;
                      const resolvedSubCategoryValue = subCategoryMatch
                        ? resolveSubCategoryOptionValue(subCategoryMatch)
                        : '';
                      const selectValue =
                        resolvedSubCategoryValue ||
                        (hasText(currentValue) ? currentValue : EMPTY_SELECT_VALUE);
                      const showCustom = hasText(currentValue) && !subCategoryMatch;
                      const categoryValue = resolveRowField(row, remarkData, 'Product Category');
                      const categoryMatch = hasText(categoryValue)
                        ? categoryLookup.get(normalizeLookupValue(categoryValue))
                        : undefined;
                      const effectiveCategoryId = categoryMatch?.id ?? null;
                      const subCategoryOptions =
                        typeof effectiveCategoryId === 'number'
                          ? (subCategoriesByCategoryId.get(effectiveCategoryId) ?? [])
                          : [];

                      return (
                        <TableCell key={`${rowId}-${header}`} className="min-w-[220px]">
                          <Select
                            value={selectValue}
                            onValueChange={(value) => handleSubCategoryChange(rowId, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Product Sub Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>None</SelectItem>
                              {showCustom && (
                                <SelectItem value={currentValue}>
                                  Current: {currentValue}
                                </SelectItem>
                              )}
                              {effectiveCategoryId == null ? (
                                <SelectItem value="__empty__" disabled>
                                  Select a Product Category first
                                </SelectItem>
                              ) : subCategoryOptions.length === 0 ? (
                                <SelectItem value="__empty__" disabled>
                                  No Product Sub Categories available
                                </SelectItem>
                              ) : (
                                subCategoryOptions.map((subCategory) => (
                                  <SelectItem
                                    key={subCategory.id ?? subCategory.code ?? subCategory.name}
                                    value={resolveSubCategoryOptionValue(subCategory)}
                                  >
                                    {formatSubCategoryLabel(subCategory)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    }
                    if (header === 'Product Name') {
                      return (
                        <TableCell key={`${rowId}-${header}`} className="min-w-[200px]">
                          <Input
                            value={resolveRowField(row, remarkData, header)}
                            onChange={(e) =>
                              handleFieldChange(rowId, 'productName', e.target.value)
                            }
                            placeholder="Product Name"
                          />
                        </TableCell>
                      );
                    }
                    if (header === 'Product code') {
                      return (
                        <TableCell key={`${rowId}-${header}`} className="min-w-[180px]">
                          <Input
                            value={resolveRowField(row, remarkData, header)}
                            onChange={(e) =>
                              handleFieldChange(rowId, 'productCode', e.target.value)
                            }
                            placeholder="PRODUCT-CODE"
                          />
                        </TableCell>
                      );
                    }
                    if (header === SYSTEM_CONFIG_LABEL) {
                      return (
                        <TableCell key={`${rowId}-${header}`} className="min-w-[180px]">
                          <Select
                            value={parsed.systemConfigKey ?? EMPTY_SELECT_VALUE}
                            onValueChange={(value) => handleSystemConfigChange(rowId, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${SYSTEM_CONFIG_LABEL}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>None</SelectItem>
                              {systemConfigs.length === 0 ? (
                                <SelectItem value="__empty__" disabled>
                                  No System Configs available
                                </SelectItem>
                              ) : (
                                systemConfigs.map((config) => (
                                  <SelectItem key={config.id} value={config.configKey}>
                                    {config.configKey}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {!hasText(parsed.systemConfigKey) && hasText(fallbackSystemConfigKey) && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Using {fallbackSystemConfigKey} from the last import.
                            </p>
                          )}
                        </TableCell>
                      );
                    }

                    const inputType = NUMBER_HEADERS.has(header)
                      ? { type: 'number', min: 0, step: 1 }
                      : PRICE_HEADERS.has(header)
                        ? { type: 'number', min: 0, step: 0.01 }
                        : { type: 'text' };
                    const cellWidth = header === 'Description' ? 'min-w-[240px]' : 'min-w-[180px]';

                    return (
                      <TableCell key={`${rowId}-${header}`} className={cellWidth}>
                        <Input
                          value={resolveRowField(row, remarkData, header)}
                          onChange={(e) => handleRemarkFieldChange(rowId, header, e.target.value)}
                          placeholder={header}
                          {...inputType}
                        />
                      </TableCell>
                    );
                  })}
                  {attributeColumns.map((column) => {
                    const options = getOptionsForRowAttribute(rowConfigId, column.key);
                    const currentValue = parsed.values[column.key];
                    const match = options.find(
                      (option) =>
                        option.code?.toLowerCase() === currentValue?.toLowerCase() ||
                        option.label?.toLowerCase() === currentValue?.toLowerCase()
                    );
                    const selectValue =
                      match?.code ?? (hasText(currentValue) ? currentValue : EMPTY_SELECT_VALUE);
                    const showCustom = hasText(currentValue) && !match;

                    return (
                      <TableCell key={`${rowId}-${column.key}`} className="min-w-[160px]">
                        <Select
                          value={selectValue}
                          onValueChange={(value) =>
                            handleAttributeChange(rowId, column.key, column.label, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${column.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY_SELECT_VALUE}>None</SelectItem>
                            {showCustom && (
                              <SelectItem value={currentValue as string}>
                                Current: {currentValue}
                              </SelectItem>
                            )}
                            {options.length === 0 ? (
                              <SelectItem value="__empty__" disabled>
                                No options available
                              </SelectItem>
                            ) : (
                              options.map((option) => (
                                <SelectItem
                                  key={`${column.key}-${option.id ?? option.code}`}
                                  value={option.code}
                                >
                                  {formatOptionLabel(option)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    );
                  })}
                  {TRAILING_HEADERS.map((header) => {
                    const inputType = NUMBER_HEADERS.has(header)
                      ? { type: 'number', min: 0, step: 1 }
                      : PRICE_HEADERS.has(header)
                        ? { type: 'number', min: 0, step: 0.01 }
                        : { type: 'text' };
                    const cellWidth =
                      header === 'Variant Stock' ? 'min-w-[160px]' : 'min-w-[180px]';

                    return (
                      <TableCell key={`${rowId}-${header}`} className={cellWidth}>
                        <Input
                          value={resolveRowField(row, remarkData, header)}
                          onChange={(e) => handleRemarkFieldChange(rowId, header, e.target.value)}
                          placeholder={header}
                          {...inputType}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="min-w-[240px]">
                    <div className="space-y-1">
                      {rowSaving ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </span>
                      ) : isValidated ? (
                        <Badge variant="default">Ready</Badge>
                      ) : rowHasInvalid ? (
                        <Badge variant="destructive">Fix required</Badge>
                      ) : rowNeedsAttention ? (
                        <Badge variant="secondary">Needs review</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {issueDetails.length > 0 ? (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs cursor-help text-red-600 font-medium truncate block max-w-[220px]">
                                {issueDetails.join(', ')}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="max-w-md p-3 bg-white border shadow-lg"
                            >
                              <div className="space-y-1">
                                <p className="font-semibold text-sm text-red-700 mb-2">
                                  {issueTitle}
                                </p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {issueDetails.map((issue, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">No Failures</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" disabled={!canSave} onClick={() => handleSaveRow(row)}>
                      Create Product
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
