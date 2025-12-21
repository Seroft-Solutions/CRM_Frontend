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

const PRODUCT_CODE_REGEX = /^[A-Za-z0-9_-]{2,20}$/;
const EMPTY_SELECT_VALUE = '__none__';

const ATTRIBUTE_ORDER = ['size', 'color', 'material', 'style'] as const;
type AttributeKey = typeof ATTRIBUTE_ORDER[number];

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  size: 'Size',
  color: 'Color',
  material: 'Material',
  style: 'Style',
};

type VariantFields = Partial<Record<AttributeKey, string>>;

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
  'Size',
  'Color',
  'Material',
  'Style',
  'Variant Price',
  'Variant Stock',
];

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseVariantAttributes(value: string | null | undefined): VariantFields {
  const fields: VariantFields = {};
  if (!hasText(value)) return fields;

  value.split(',').forEach((part) => {
    const [rawKey, ...rest] = part.split(':');
    const normalized = normalizeKey(rawKey ?? '');
    const foundKey = ATTRIBUTE_ORDER.find((key) => normalized === key);
    if (!foundKey) return;
    const rawValue = rest.join(':').trim();
    if (rawValue) {
      fields[foundKey] = rawValue;
    }
  });

  return fields;
}

function formatVariantAttributes(fields: VariantFields): string {
  const parts: string[] = [];
  ATTRIBUTE_ORDER.forEach((key) => {
    const value = fields[key];
    if (hasText(value)) {
      parts.push(`${ATTRIBUTE_LABELS[key]}:${value.trim()}`);
    }
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

function toAttributeKey(attribute?: SystemConfigAttributeDTO): AttributeKey | null {
  if (!attribute) return null;
  const normalizedName = normalizeKey(attribute.name ?? '');
  const normalizedLabel = normalizeKey(attribute.label ?? '');

  return (
    ATTRIBUTE_ORDER.find((key) => key === normalizedName) ||
    ATTRIBUTE_ORDER.find((key) => key === normalizedLabel) ||
    null
  );
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

  const { data: allAttributes } = useGetAllSystemConfigAttributes(
    { size: 1000, 'status.equals': 'ACTIVE' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const relevantAttributes = useMemo(() => {
    return (allAttributes ?? []).filter((attr) => toAttributeKey(attr));
  }, [allAttributes]);

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

  const optionsByKey = useMemo(() => {
    const grouped: Record<AttributeKey, SystemConfigAttributeOptionDTO[]> = {
      size: [],
      color: [],
      material: [],
      style: [],
    };
    const attributeKeyById = new Map<number, AttributeKey>();

    relevantAttributes.forEach((attr) => {
      if (attr.id == null) return;
      const key = toAttributeKey(attr);
      if (key) {
        attributeKeyById.set(attr.id, key);
      }
    });

    (attributeOptions ?? []).forEach((option) => {
      const attributeId = option.attribute?.id;
      if (attributeId == null) return;
      const key = attributeKeyById.get(attributeId);
      if (!key) return;
      grouped[key].push(option);
    });

    const deduped: Record<AttributeKey, SystemConfigAttributeOptionDTO[]> = {
      size: [],
      color: [],
      material: [],
      style: [],
    };

    ATTRIBUTE_ORDER.forEach((key) => {
      const seen = new Set<string>();
      grouped[key].forEach((option) => {
        const token = `${option.code}`.toLowerCase();
        if (seen.has(token)) return;
        seen.add(token);
        deduped[key].push(option);
      });
    });

    return deduped;
  }, [relevantAttributes, attributeOptions]);

  useEffect(() => {
    const rows = (importHistoryData ?? []).filter(
      (row) => typeof row.id === 'number' && isProductImportHistoryRow(row)
    );
    setEditableRows(rows);
    setPendingRowIds(new Set());
    setRowErrors({});
  }, [importHistoryData]);

  const { mutateAsync: deleteAllImportHistoryEntriesAsync } = useDeleteAllImportHistoryEntries();

  const computeRowIssues = useCallback(
    (row: ImportHistoryDTO): string[] => {
      const issues: string[] = [];
      const name = (row.productName ?? '').trim();
      const code = (row.productCode ?? '').trim();
      const attributes = parseVariantAttributes(row.variantAttributes);

      if (name.length < 2 || name.length > 100) {
        issues.push('Product Name must be 2-100 characters.');
      }
      if (!PRODUCT_CODE_REGEX.test(code)) {
        issues.push('Product Code must be 2-20 characters (letters, numbers, underscores, hyphens).');
      }

      const hasAttribute = ATTRIBUTE_ORDER.some((key) => hasText(attributes[key]));
      if (!hasAttribute) {
        issues.push('Provide at least one of Size, Color, Material, or Style.');
      }

      ATTRIBUTE_ORDER.forEach((key) => {
        const value = attributes[key];
        if (!hasText(value)) return;
        const options = optionsByKey[key] ?? [];
        if (!options.length) return;
        const match = options.some(
          (option) =>
            option.code?.toLowerCase() === value.toLowerCase() ||
            option.label?.toLowerCase() === value.toLowerCase()
        );
        if (!match) {
          issues.push(`${ATTRIBUTE_LABELS[key]} value '${value}' is not in system config options.`);
        }
      });

      return issues;
    },
    [optionsByKey]
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
    (rowId: number, key: AttributeKey, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const fields = parseVariantAttributes(row.variantAttributes);
          if (value === EMPTY_SELECT_VALUE) {
            delete fields[key];
          } else {
            fields[key] = value;
          }
          return { ...row, variantAttributes: formatVariantAttributes(fields) };
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

  const handleSaveRow = useCallback(
    async (row: ImportHistoryDTO): Promise<boolean> => {
      if (typeof row.id !== 'number') return false;
      const issues = computeRowIssues(row);
      if (issues.length) {
        toast.error('Please fix validation errors before saving.');
        setRowErrors((prev) => ({ ...prev, [row.id!]: issues.join(' ') }));
        return false;
      }

      const payload: ImportHistoryDTO = {
        ...row,
        productName: row.productName?.trim(),
        productCode: row.productCode?.trim(),
        variantAttributes: formatVariantAttributes(parseVariantAttributes(row.variantAttributes)),
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
    [computeRowIssues, refetch]
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
      const fields = parseVariantAttributes(row.variantAttributes);
      return [
        '',
        '',
        row.productName ?? '',
        row.productCode ?? '',
        '',
        '',
        '',
        '',
        '',
        '',
        fields.size ?? '',
        fields.color ?? '',
        fields.material ?? '',
        fields.style ?? '',
        '',
        '',
        row.issue ?? '',
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([ [...BASE_HEADERS, 'Reason'], ...sheetRows ]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Products');
    XLSX.writeFile(workbook, 'product-import-failed-rows.xlsx');
  }, [editableRows]);

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
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableRows.map((row) => {
              const rowId = row.id as number;
              const fields = parseVariantAttributes(row.variantAttributes);
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
                  {ATTRIBUTE_ORDER.map((key) => {
                    const options = optionsByKey[key] ?? [];
                    const currentValue = fields[key];
                    const match = options.find(
                      (option) =>
                        option.code?.toLowerCase() === currentValue?.toLowerCase() ||
                        option.label?.toLowerCase() === currentValue?.toLowerCase()
                    );
                    const selectValue =
                      match?.code ?? (hasText(currentValue) ? currentValue : EMPTY_SELECT_VALUE);
                    const showCustom = hasText(currentValue) && !match;

                    return (
                      <TableCell key={key} className="min-w-[160px]">
                        <Select
                          value={selectValue}
                          onValueChange={(value) => handleAttributeChange(rowId, key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${ATTRIBUTE_LABELS[key]}`} />
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
                                <SelectItem key={`${key}-${option.id ?? option.code}`} value={option.code}>
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
