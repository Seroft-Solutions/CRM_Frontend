'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useCountImportHistories,
  useDeleteAllImportHistoryEntries,
  useGetAllImportHistories,
  useProcessImportHistory,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { usePaginationState } from '../components/advanced-pagination';
import { failedCallsDebugLog } from '../utils/failed-calls-logger';
import { TEMPLATE_FIELD_ORDER, normalizeKey } from '../constants/failed-calls';
import { callImportConfig } from '../config';
import { useFailedCallsMasterData } from './use-failed-calls-master-data';
import { usePincodeValidation } from './use-pincode-validation';
import { useFailedCallsValidation } from './use-failed-calls-validation';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export function useFailedCallsTable() {
  const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
  const [editableData, setEditableData] = useState<ImportHistoryDTO[]>([]);
  const [pendingRowIds, setPendingRowIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalRowsRef = useRef<ImportHistoryDTO[]>([]);

  const apiPage = Math.max(page - 1, 0);

  const liveQueryOptions = useMemo(
    () => ({
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: 'always' as const,
      refetchOnWindowFocus: 'always' as const,
      refetchOnReconnect: 'always' as const,
      keepPreviousData: false,
    }),
    []
  );

  const {
    data: importHistoryData,
    isLoading,
    isError,
    error: importHistoryError,
    refetch,
  } = useGetAllImportHistories({
    page: apiPage,
    size: pageSize,
    sort: ['id,desc'],
  }, { query: liveQueryOptions });

  const { data: totalCount = 0 } = useCountImportHistories({}, { query: liveQueryOptions });
  const totalItems = totalCount ?? 0;

  useEffect(() => {
    if (importHistoryData) {
      const failedRows = importHistoryData.filter((item) => {
        const hasIssue = Boolean(item.issue && item.issue.trim() !== '');
        if (!hasIssue) return false;

        // Guard: ImportHistory is shared, so exclude failed customer-import rows.
        const hasCallOrProductSignals = Boolean(
          (item.callType && item.callType.trim() !== '') ||
            (item.subCallType && item.subCallType.trim() !== '') ||
            (item.priority && item.priority.trim() !== '') ||
            (item.callStatus && item.callStatus.trim() !== '') ||
            (item.externalId && item.externalId.trim() !== '') ||
            (item.productName && item.productName.trim() !== '') ||
            (item.productCode && item.productCode.trim() !== '')
        );

        return hasCallOrProductSignals;
      });

      setEditableData(failedRows);
      originalRowsRef.current = failedRows.map((row) => ({ ...row }));
      setHasUnsavedChanges(false);
    }
  }, [importHistoryData]);

  useEffect(() => {
    if (editableData.length === 0) {
      setHasUnsavedChanges(false);

      return;
    }

    const originalMap = new Map(
      originalRowsRef.current
        .filter((row) => row.id !== undefined && row.id !== null)
        .map((row) => [row.id as number, row])
    );
    const normalize = (value: unknown) => (value ?? '').toString();

    const hasChanges = editableData.some((row) => {
      if (row.id === undefined || row.id === null) {
        return false;
      }

      const original = originalMap.get(row.id);

      if (!original) {
        return false;
      }

      return TEMPLATE_FIELD_ORDER.some((fieldKey) => {
        const currentValue = normalize(row[fieldKey]);
        const originalValue = normalize(original[fieldKey]);

        return currentValue !== originalValue;
      });
    });

    setHasUnsavedChanges(hasChanges);
  }, [editableData]);

  const {
    calltypeOptions,
    subcalltypeOptions,
    customerMap,
    productMap,
    callTypeMap,
    subCallTypeMap,
    priorityMap,
    callStatusMap,
    canResolveReferences,
    getColumnOptions,
  } = useFailedCallsMasterData();

  const { validatePincodeFormat, validatePincodeExists } = usePincodeValidation();

  const { computeInvalidFields, getComputedIssues } = useFailedCallsValidation({
    callTypeMap,
    subCallTypeMap,
    priorityMap,
    callStatusMap,
    calltypeOptions,
    subcalltypeOptions,
    customerMap,
    validatePincodeFormat,
    canResolveReferences,
  });

  const { mutateAsync: deleteAllCallImportHistoriesAsync, isPending: isClearingAllFailedEntries } =
    useDeleteAllImportHistoryEntries({
      mutation: {
        onError: (error) => {
          toast.error('Failed to clear all failed import entries: ' + error.message);
        },
      },
    });

  const isClearing = isClearingAllFailedEntries;
  const { mutateAsync: processImportHistoryAsync } = useProcessImportHistory();

  const handleClearAllFailedEntries = useCallback(async () => {
    try {
      const response = await deleteAllCallImportHistoriesAsync();
      const deletedCount = Number((response['deletedCount'] as number | undefined) ?? 0);
      const rawMessage = response['message'];
      const message = typeof rawMessage === 'string' ? rawMessage : undefined;

      if (deletedCount > 0) {
        toast.success(
          message ??
            `Deleted ${deletedCount} failed import entr${deletedCount === 1 ? 'y' : 'ies'}.`
        );
      } else {
        toast.info(message ?? 'No failed import entries to clear.');
      }
      refetch();
    } catch (error) {
      failedCallsDebugLog('Failed to clear all failed import entries', error);
    }
  }, [deleteAllCallImportHistoriesAsync, refetch]);

  const handleDownloadReport = useCallback(() => {
    if (!editableData.length) {
      toast.info('No failed rows to download.');

      return;
    }

    const headers = [...callImportConfig.columns.map((c) => c.header), 'Reason'];
    const sheetRows = editableData.map((row) => {
      const values = TEMPLATE_FIELD_ORDER.map((fieldKey) => (row[fieldKey] as string) ?? '');

      values.push(row.issue ?? '');

      return values;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Rows');
    XLSX.writeFile(workbook, 'call-import-failed-rows.xlsx');
  }, [editableData]);

  const handleFieldChange = useCallback(
    (rowIndex: number, fieldName: keyof ImportHistoryDTO, value: string) => {
      const rowId = editableData[rowIndex]?.id;

      setEditableData((prev) => {
        const updated = [...prev];
        const original = updated[rowIndex];

        if (!original) {
          return prev;
        }

        const current: ImportHistoryDTO = { ...original };

        current[fieldName] = value as ImportHistoryDTO[keyof ImportHistoryDTO];

        if (fieldName === 'callType') {
          const selectedCallType = calltypeOptions.find(
            (ct) => normalizeKey(ct.name) === normalizeKey(value)
          );

          if (selectedCallType?.id) {
            const availableSubCallTypes = subcalltypeOptions.filter(
              (sct) => sct.callType?.id === selectedCallType.id
            );

            current.subCallType = availableSubCallTypes.length === 0 ? '' : '';
          } else {
            current.subCallType = '';
          }
        }

        updated[rowIndex] = current;

        return updated;
      });

      if (rowId) {
        setRowErrors((prevErrors) => {
          if (!prevErrors[rowId]) {
            return prevErrors;
          }
          const next = { ...prevErrors };

          delete next[rowId];

          return next;
        });
      }

      failedCallsDebugLog('Field updated - no auto-save', { rowIndex, fieldName, value });
    },
    [editableData, calltypeOptions, subcalltypeOptions]
  );

  const validatedRows = useMemo(
    () =>
      editableData.filter((row) => {
        if (!row?.id) {
          return false;
        }
        const invalid = computeInvalidFields(row);

        return invalid.size === 0 && !pendingRowIds.has(row.id);
      }),
    [editableData, computeInvalidFields, pendingRowIds]
  );

  const validatedRowCount = validatedRows.length;

  const handleSaveValidatedRows = useCallback(async () => {
    if (!validatedRows.length) {
      toast.info('No validated rows available to save.');

      return;
    }

    setIsBulkSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validatedRows) {
      try {
        setPendingRowIds((prev) => {
          const next = new Set(prev);

          next.add(row.id!);

          return next;
        });

        const customerIsNew = !customerMap.has(normalizeKey(row.customerBusinessName));

        if (customerIsNew && row.zipCode) {
          const pincodeValid = await validatePincodeExists(row.zipCode);

          if (!pincodeValid) {
            errorCount += 1;
            toast.error(
              `Zip Code ${row.zipCode} is not valid for row ${row.id}. Please update and try again.`
            );
            continue;
          }
        }

        await processImportHistoryAsync({ id: row.id!, data: row });
        successCount += 1;
        setEditableData((prev) => prev.filter((item) => item.id !== row.id));
      } catch (error) {
        errorCount += 1;
        const message = error instanceof Error ? error.message : 'Unknown error';

        toast.error(`Failed to save row ${row.id}: ${message}`);
        setRowErrors((prev) => ({ ...prev, [row.id!]: message }));
      } finally {
        setPendingRowIds((prev) => {
          const next = new Set(prev);

          next.delete(row.id!);

          return next;
        });
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully saved ${successCount} row${successCount === 1 ? '' : 's'}.`);
      refetch();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} row${errorCount === 1 ? '' : 's'} failed to save. Please review.`);
    }

    setIsBulkSaving(false);
  }, [validatedRows, processImportHistoryAsync, refetch, customerMap, validatePincodeExists]);

  return {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    editableData,
    pendingRowIds,
    rowErrors,
    isLoading,
    totalItems,
    customerMap,
    productMap,
    computeInvalidFields,
    getComputedIssues,
    getColumnOptions,
    handleFieldChange,
    handleDownloadReport,
    handleClearAllFailedEntries,
    isClearing,
    isError,
    importHistoryError,
    refetchImportHistory: refetch,
    validatedRowCount,
    handleSaveValidatedRows,
    isBulkSaving,
    hasUnsavedChanges,
  };
}
