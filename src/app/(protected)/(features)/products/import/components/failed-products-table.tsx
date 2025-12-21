'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type {
  ImportHistoryDTO,
  ProductDTO,
  SystemConfigAttributeDTO,
  SystemConfigAttributeOptionDTO,
} from '@/core/api/generated/spring/schemas';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import {
  useDeleteAllImportHistoryEntries,
  useGetAllImportHistories,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import {
  useGetAllSystemConfigAttributes,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import {
  useGetAllSystemConfigAttributeOptions,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

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
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSystemConfigKey(value: string): string {
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

function formatOptionLabel(option: SystemConfigAttributeOptionDTO): string {
  if (option.label && option.code && option.label !== option.code) {
    return `${option.label} (${option.code})`;
  }

  return option.label || option.code;
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

  const { data: systemConfigs = [] } = useGetAllSystemConfigs(
    { page: 0, size: 1000, 'status.equals': 'ACTIVE', 'systemConfigType.equals': 'PRODUCT' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const { data: allAttributes } = useGetAllSystemConfigAttributes(
    { size: 1000, 'status.equals': 'ACTIVE' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const systemConfigByKey = useMemo(() => {
    const map = new Map<string, { id: number; configKey: string }>();
    systemConfigs.forEach((config: any) => {
      if (typeof config.id !== 'number' || !hasText(config.configKey)) return;
      map.set(normalizeSystemConfigKey(config.configKey), { id: config.id, configKey: config.configKey });
    });
    return map;
  }, [systemConfigs]);

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
    () => relevantAttributes.map((attr) => attr.id).filter((id): id is number => typeof id === 'number'),
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

    const includeConfigAttributes = relevantConfigIds.size > 0;
    const configOrder = includeConfigAttributes
      ? systemConfigs
          .map((config: any) => config.id)
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
  }, [systemConfigs, relevantConfigIds, attributesByConfigId, editableRows]);

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
      const name = (row.productName ?? '').trim();
      const code = (row.productCode ?? '').trim();
      const parsed = parseVariantAttributes(row.variantAttributes);

      if (name.length < 2 || name.length > 100) {
        issues.push('Product Name must be 2-100 characters.');
      }
      if (!PRODUCT_CODE_REGEX.test(code)) {
        issues.push('Product Code must be 2-20 characters (letters, numbers, underscores, hyphens).');
      }

      const hasAttribute = Object.values(parsed.values).some((value) => hasText(value));
      if (!hasAttribute) {
        issues.push('Provide at least one variant attribute.');
      }

      const configId = resolveConfigId(parsed.systemConfigKey);
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
    [resolveConfigId, attributesByConfigId, getOptionsForRowAttribute, attributeLabelData]
  );

  const validatedRows = useMemo(() => {
    return editableRows.filter((row) => {
      if (typeof row.id !== 'number') return false;
      if (pendingRowIds.has(row.id)) return false;
      return computeRowIssues(row).length === 0;
    });
  }, [editableRows, pendingRowIds, computeRowIssues]);

  const handleFieldChange = useCallback((rowId: number, field: keyof ImportHistoryDTO, value: string) => {
    setEditableRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value as any } : row))
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
      const payload: ImportHistoryDTO = {
        ...row,
        productName: row.productName?.trim(),
        productCode: row.productCode?.trim(),
        variantAttributes: buildVariantAttributes(
          parsed.values,
          attributeLabelData.labelByKey,
          parsed.labels
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
      } catch (e: any) {
        const responseData = e?.response?.data;
        let message =
          responseData?.title ||
          responseData?.detail ||
          responseData?.message ||
          e?.message ||
          'Unknown error';
        if (typeof responseData?.message === 'string' && responseData.message.startsWith('error.')) {
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
    [computeRowIssues, refetch, attributeLabelData]
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
      const deleted = Number((resp as any)?.deletedCount ?? 0);
      const message = typeof (resp as any)?.message === 'string' ? ((resp as any).message as string) : undefined;

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
      const rowValues: Record<string, string> = {};
      rowValues['Product Name'] = row.productName ?? '';
      rowValues['Product code'] = row.productCode ?? '';
      rowValues[SYSTEM_CONFIG_LABEL] = parsed.systemConfigKey ?? '';

      attributeColumns.forEach((column) => {
        rowValues[column.label] = parsed.values[column.key] ?? '';
      });

      const headers = [...BASE_HEADERS, ...attributeColumns.map((column) => column.label), ...TRAILING_HEADERS];
      return [
        ...headers.map((header) => rowValues[header] ?? ''),
        row.issue ?? '',
      ];
    });

    const headers = [...BASE_HEADERS, ...attributeColumns.map((column) => column.label), ...TRAILING_HEADERS];
    const worksheet = XLSX.utils.aoa_to_sheet([[...headers, 'Reason'], ...sheetRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Products');
    XLSX.writeFile(workbook, 'product-import-failed-rows.xlsx');
  }, [editableRows, attributeColumns]);

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
          <Button onClick={handleSaveValidated}>
            Create Products ({validatedRows.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Product Code</TableHead>
              <TableHead>{SYSTEM_CONFIG_LABEL}</TableHead>
              {attributeColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableRows.map((row) => {
              const rowId = row.id as number;
              const parsed = parseVariantAttributes(row.variantAttributes);
              const rowConfigId = resolveConfigId(parsed.systemConfigKey);
              const issues = computeRowIssues(row);
              const canSave = issues.length === 0 && !pendingRowIds.has(rowId);
              const errorText = rowErrors[rowId];

              return (
                <TableRow key={rowId}>
                  <TableCell>{rowId}</TableCell>
                  <TableCell className="min-w-[200px]">
                    <Input
                      value={(row.productName ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'productName', e.target.value)}
                      placeholder="Product Name"
                    />
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <Input
                      value={(row.productCode ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'productCode', e.target.value)}
                      placeholder="PRODUCT-CODE"
                    />
                  </TableCell>
                  <TableCell className="min-w-[180px]">
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
                          systemConfigs.map((config: any) => (
                            <SelectItem key={config.id} value={config.configKey}>
                              {config.configKey}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
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
                          onValueChange={(value) => handleAttributeChange(rowId, column.key, column.label, value)}
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
                  <TableCell className="min-w-[240px]">
                    <div className="space-y-1">
                      {errorText ? (
                        <Badge variant="destructive">Needs Fix</Badge>
                      ) : canSave ? (
                        <Badge variant="default">Validated</Badge>
                      ) : (
                        <Badge variant="secondary">Pending Fix</Badge>
                      )}
                      {issues.length > 0 && (
                        <p className="text-xs text-muted-foreground whitespace-normal">
                          {issues.join(' ')}
                        </p>
                      )}
                      {errorText && (
                        <p className="text-xs text-red-700 whitespace-normal">{errorText}</p>
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
