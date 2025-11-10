'use client';

import {
  useCreateCall,
  usePartialUpdateCall,
  getAllCalls,
  useGetAllPriorities,
  useGetAllCallTypes,
  useGetAllSubCallTypes,
  useGetAllCustomers,
  useGetAllProducts,
  useGetAllCallStatuses,
} from '@/core/api/generated/spring';
import {
  useCountImportHistories,
  useDeleteImportHistory,
  useGetAllImportHistories,
  getAllImportHistories,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { AdvancedPagination, usePaginationState } from './advanced-pagination';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, ChevronsUpDown, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { callImportConfig } from '../config';
import { CallDTOStatus } from '@/core/api/generated/spring/schemas/CallDTOStatus';
import { CallDTO } from '@/core/api/generated/spring/schemas/CallDTO';

const debugLog = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    console.debug('[FailedCallsTable]', ...args);
  }
};

const tableScrollStyles = `
  .table-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const HEADERS = [
  'Customer name',
  'Zip Code',
  'Product Name',
  'External Id',
  'Call Type',
  'Sub Call Type',
  'Priority',
  'Call Status',
  'Reason',
];

type Option = { value: string; label: string };

const TEMPLATE_FIELD_ORDER: Array<keyof ImportHistoryDTO> = [
  'externalId',
  'customerBusinessName',
  'zipCode',
  'productName',
  'callType',
  'subCallType',
  'priority',
  'callStatus',
];

const normalizeKey = (value?: string | null) => value?.trim().toLowerCase() ?? '';
const buildSubCallTypeKey = (callTypeId: number, name: string) =>
  `${callTypeId}:${normalizeKey(name)}`;

function SearchableSelect({
  value,
  options,
  placeholder,
  onSelect,
  disabled,
  invalid,
}: {
  value: string;
  options: Option[];
  placeholder: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const currentLabel = options.find((opt) => opt.value === value)?.label ?? value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between text-left font-normal',
            invalid && 'border-destructive text-destructive bg-red-50',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{currentLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder}`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(selected) => {
                    onSelect(selected === value ? value : selected);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FailedCallsTable() {
  const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
  const [editableData, setEditableData] = useState<ImportHistoryDTO[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [pendingRowIds, setPendingRowIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const apiPage = Math.max(page - 1, 0);

  const {
    data: importHistoryData,
    isLoading,
    refetch,
  } = useGetAllImportHistories({
    page: apiPage,
    size: pageSize,
    sort: ['id,desc'],
  });

  const { data: totalCount = 0 } = useCountImportHistories({});
  const totalItems = totalCount ?? 0;

  useEffect(() => {
    if (importHistoryData) {
      setEditableData(importHistoryData.filter((item) => item.issue && item.issue.trim() !== ''));
    }
  }, [importHistoryData]);

  const { data: priorityOptions = [] } = useGetAllPriorities({ page: 0, size: 1000 });
  const { data: calltypeOptions = [] } = useGetAllCallTypes({ page: 0, size: 1000 });
  const { data: subcalltypeOptions = [] } = useGetAllSubCallTypes({ page: 0, size: 1000 });
  const { data: customerOptions = [] } = useGetAllCustomers({ page: 0, size: 1000 });
  const { data: productOptions = [] } = useGetAllProducts({ page: 0, size: 1000 });
  const { data: callstatusOptions = [] } = useGetAllCallStatuses({ page: 0, size: 1000 });
  const customerMap = useMemo(() => {
    const map = new Map<string, (typeof customerOptions)[number]>();
    customerOptions.forEach((customer) => {
      const key = normalizeKey(customer.customerBusinessName);
      if (key) {
        map.set(key, customer);
      }
    });
    return map;
  }, [customerOptions]);

  const productMap = useMemo(() => {
    const map = new Map<string, (typeof productOptions)[number]>();
    productOptions.forEach((product) => {
      const key = normalizeKey(product.name);
      if (key) {
        map.set(key, product);
      }
    });
    return map;
  }, [productOptions]);

  const callTypeMap = useMemo(() => {
    const map = new Map<string, (typeof calltypeOptions)[number]>();
    calltypeOptions.forEach((callType) => {
      const key = normalizeKey(callType.name);
      if (key) {
        map.set(key, callType);
      }
    });
    return map;
  }, [calltypeOptions]);

  const subCallTypeMap = useMemo(() => {
    const map = new Map<string, (typeof subcalltypeOptions)[number]>();
    subcalltypeOptions.forEach((subCallType) => {
      const parentId = subCallType.callType?.id;
      if (parentId && subCallType.name) {
        map.set(buildSubCallTypeKey(parentId, subCallType.name), subCallType);
      }
    });
    return map;
  }, [subcalltypeOptions]);

  const priorityMap = useMemo(() => {
    const map = new Map<string, (typeof priorityOptions)[number]>();
    priorityOptions.forEach((priority) => {
      const key = normalizeKey(priority.name);
      if (key) {
        map.set(key, priority);
      }
    });
    return map;
  }, [priorityOptions]);

  const callStatusMap = useMemo(() => {
    const map = new Map<string, (typeof callstatusOptions)[number]>();
    callstatusOptions.forEach((status) => {
      const key = normalizeKey(status.name);
      if (key) {
        map.set(key, status);
      }
    });
    return map;
  }, [callstatusOptions]);

  const canResolveReferences = Boolean(
    customerOptions.length &&
      productOptions.length &&
      calltypeOptions.length &&
      priorityOptions.length &&
      callstatusOptions.length
  );

  const computeInvalidFields = useCallback(
    (row: ImportHistoryDTO) => {
      const invalid = new Set<keyof ImportHistoryDTO>();

      const customer =
        customerMap.size === 0 ? null : customerMap.get(normalizeKey(row.customerBusinessName));
      if (!row.customerBusinessName || (customerMap.size > 0 && !customer)) {
        invalid.add('customerBusinessName');
      }

      const product = productMap.size === 0 ? null : productMap.get(normalizeKey(row.productName));
      if (!row.productName || (productMap.size > 0 && !product)) {
        invalid.add('productName');
      }

      const callType =
        callTypeMap.size === 0
          ? null
          : callTypeMap.get(normalizeKey(row.callType)) ||
            calltypeOptions.find((ct) => normalizeKey(ct.name) === normalizeKey(row.callType));
      if (!row.callType || (callTypeMap.size > 0 && !callType)) {
        invalid.add('callType');
      }

      if (row.subCallType) {
        const resolvedSubCallType = (() => {
          if (callType?.id) {
            const subKey = buildSubCallTypeKey(callType.id, row.subCallType);
            const match = subCallTypeMap.get(subKey);
            if (match) {
              return match;
            }
            return subcalltypeOptions.find(
              (sct) =>
                sct.callType?.id === callType.id &&
                normalizeKey(sct.name) === normalizeKey(row.subCallType)
            );
          }
          return subcalltypeOptions.find(
            (sct) => normalizeKey(sct.name) === normalizeKey(row.subCallType)
          );
        })();
        if (!resolvedSubCallType) {
          invalid.add('subCallType');
        }
      }

      const priority = priorityMap.size === 0 ? null : priorityMap.get(normalizeKey(row.priority));
      if (!row.priority || (priorityMap.size > 0 && !priority)) {
        invalid.add('priority');
      }

      const callStatus =
        callStatusMap.size === 0 ? null : callStatusMap.get(normalizeKey(row.callStatus));
      if (!row.callStatus || (callStatusMap.size > 0 && !callStatus)) {
        invalid.add('callStatus');
      }

      if (!row.zipCode || row.zipCode.trim().length === 0) {
        invalid.add('zipCode');
      }

      // External ID is optional in the template; leave it blank if importer didn't supply one

      return invalid;
    },
    [
      customerMap,
      productMap,
      callTypeMap,
      subCallTypeMap,
      priorityMap,
      callStatusMap,
      calltypeOptions,
      subcalltypeOptions,
    ]
  );

  const getComputedIssues = useCallback(
    (row: ImportHistoryDTO, invalid: Set<keyof ImportHistoryDTO>) => {
      const issues: string[] = [];
      if (!canResolveReferences) {
        issues.push('Master data is still loading. Please wait before validating this row.');
      }
      invalid.forEach((field) => {
        switch (field) {
          case 'customerBusinessName':
            issues.push('Customer name not found in master data.');
            break;
          case 'productName':
            issues.push('Product name does not match existing products.');
            break;
          case 'callType':
            issues.push('Call Type mismatch. Please select a valid Call Type.');
            break;
          case 'subCallType':
            issues.push('Sub Call Type must belong to the selected Call Type.');
            break;
          case 'priority':
            issues.push('Priority is required and must match master data.');
            break;
          case 'callStatus':
            issues.push('Call Status is required and must match master data.');
            break;
          case 'zipCode':
            issues.push('Zip Code is required.');
            break;
          default:
            break;
        }
      });
      return issues;
    },
    [canResolveReferences]
  );

  const prepareCallPayload = useCallback(
    (row: ImportHistoryDTO) => {
      const payload: Partial<CallDTO> = {
        status: CallDTOStatus.ACTIVE,
      };

      if (row.externalId?.trim()) {
        payload.externalId = row.externalId.trim();
      }

      const customer = customerMap.get(normalizeKey(row.customerBusinessName));
      const product = productMap.get(normalizeKey(row.productName));
      const callType =
        callTypeMap.get(normalizeKey(row.callType)) ||
        calltypeOptions.find((ct) => normalizeKey(ct.name) === normalizeKey(row.callType));
      const priority = priorityMap.get(normalizeKey(row.priority));
      const callStatus = callStatusMap.get(normalizeKey(row.callStatus));

      if (!customer?.id) {
        throw new Error('Customer could not be resolved. Please re-select the customer.');
      }
      if (!product?.id) {
        throw new Error('Product could not be resolved. Please re-select the product.');
      }
      if (!callType?.id) {
        throw new Error('Call Type could not be resolved. Please re-select the call type.');
      }
      if (!priority?.id) {
        throw new Error('Priority could not be resolved. Please re-select the priority.');
      }
      if (!callStatus?.id) {
        throw new Error('Call Status could not be resolved. Please re-select the call status.');
      }

      payload.customer = { id: customer.id } as any;
      payload.product = { id: product.id } as any;
      payload.callType = { id: callType.id } as any;
      payload.priority = { id: priority.id } as any;
      payload.callStatus = { id: callStatus.id } as any;

      if (row.subCallType) {
        if (!callType?.id) {
          throw new Error('Please pick a call type before selecting a sub call type.');
        }
        const subKey = buildSubCallTypeKey(callType.id, row.subCallType);
        const subCallType =
          subCallTypeMap.get(subKey) ||
          subcalltypeOptions.find(
            (sct) =>
              sct.callType?.id === callType.id &&
              normalizeKey(sct.name) === normalizeKey(row.subCallType)
          );
        if (!subCallType?.id) {
          throw new Error(
            'Sub Call Type could not be resolved. Please re-select the sub call type.'
          );
        }
        payload.subCallType = { id: subCallType.id } as any;
      } else {
        delete payload.subCallType;
      }

      return payload as CallDTO;
    },
    [
      customerMap,
      productMap,
      callTypeMap,
      subCallTypeMap,
      priorityMap,
      callStatusMap,
      calltypeOptions,
      subcalltypeOptions,
    ]
  );

  const { mutateAsync: createCallAsync, isPending: isCreating } = useCreateCall({
    mutation: {
      onError: (error) => {
        toast.error('Failed to create call: ' + error.message);
      },
    },
  });

  const { mutateAsync: partialUpdateCallAsync, isPending: isUpdating } = usePartialUpdateCall({
    mutation: {
      onError: (error) => {
        toast.error('Failed to update call: ' + error.message);
      },
    },
  });

  const { mutateAsync: deleteImportHistoryAsync } = useDeleteImportHistory({
    mutation: {
      onError: (error) => {
        toast.error('Failed to delete import history entry: ' + error.message);
      },
    },
  });

  // Debounce utility function
  const handleClearAllFailedEntries = async () => {
    setIsClearing(true);
    try {
      // Fetch all import history entries
      const allFailedEntries = await getAllImportHistories({ page: 0, size: 1000000 });

      if (allFailedEntries && allFailedEntries.length > 0) {
        // Delete each entry
        for (const entry of allFailedEntries) {
          if (entry.id) {
            await deleteImportHistoryAsync({ id: entry.id });
          }
        }
        toast.success('All failed import entries cleared successfully.');
      } else {
        toast.info('No failed import entries to clear.');
      }
      refetch(); // Refetch the list to update the table
    } catch (error: any) {
      toast.error('Failed to clear all failed import entries: ' + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadReport = () => {
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
  };

  const handleUpdateRow = useCallback(
    async (item: ImportHistoryDTO) => {
      if (!item?.id) {
        return null;
      }

      if (!canResolveReferences) {
        debugLog('Reference data not ready for row', { rowId: item.id });
        toast.info('Reference data is still loading. Please try again once options are ready.');
        return null;
      }

      const payload = prepareCallPayload(item);
      const externalId = item.externalId?.trim();
      let existingCall: any = undefined;

      if (externalId) {
        const existingCallsResponse = await getAllCalls({
          'externalId.equals': externalId,
          page: 0,
          size: 1,
        } as any);
        existingCall = existingCallsResponse?.[0];
      }

      debugLog('Processing row', {
        rowId: item.id,
        externalId,
        action: existingCall ? 'update' : 'create',
      });

      if (existingCall && existingCall.id) {
        await partialUpdateCallAsync({
          id: existingCall.id,
          data: { ...payload, id: existingCall.id },
        });
      } else {
        await createCallAsync({ data: payload });
      }

      await deleteImportHistoryAsync({ id: item.id });
      setEditableData((prev) => prev.filter((row) => row.id !== item.id));
      refetch();

      debugLog('Row processed successfully', {
        rowId: item.id,
        externalId,
        action: existingCall ? 'updated' : 'created',
      });
      return existingCall ? 'updated' : 'created';
    },
    [
      canResolveReferences,
      prepareCallPayload,
      partialUpdateCallAsync,
      createCallAsync,
      deleteImportHistoryAsync,
      refetch,
    ]
  );

  const handleFieldChange = (
    rowIndex: number,
    fieldName: keyof ImportHistoryDTO,
    value: string
  ) => {
    let updatedRow: ImportHistoryDTO | null = null;
    setEditableData((prev) => {
      const updated = [...prev];
      const original = updated[rowIndex];
      if (!original) {
        return prev;
      }
      const current = { ...original } as ImportHistoryDTO;
      (current[fieldName] as any) = value;
      if (fieldName === 'callType') {
        current.subCallType = '';
      }
      updated[rowIndex] = current;
      updatedRow = current;
      return updated;
    });

    if (updatedRow?.id) {
      setRowErrors((prev) => {
        if (!updatedRow?.id || !prev[updatedRow.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[updatedRow.id];
        return next;
      });
      debugLog('Field updated', { rowId: updatedRow.id, fieldName, value });
    }

    if (updatedRow?.id && canResolveReferences) {
      const invalid = computeInvalidFields(updatedRow);
      if (invalid.size === 0) {
        debugLog('Auto-save triggered via edit', {
          rowId: updatedRow.id,
          externalId: updatedRow.externalId,
        });
        autoSaveRow(updatedRow);
      } else {
        debugLog('Row still invalid after edit', {
          rowId: updatedRow.id,
          invalid: Array.from(invalid),
        });
      }
    }
  };

  const autoSaveRow = useCallback(
    async (row: ImportHistoryDTO) => {
      if (!row.id) {
        return;
      }
      let shouldSave = false;
      setPendingRowIds((prev) => {
        if (prev.has(row.id!)) {
          return prev;
        }
        shouldSave = true;
        const next = new Set(prev);
        next.add(row.id!);
        return next;
      });
      if (!shouldSave) {
        return;
      }

      debugLog('Auto-save queued', { rowId: row.id, externalId: row.externalId });
      try {
        await handleUpdateRow(row);
      } catch (error: any) {
        debugLog('Row processing failed', { rowId: row.id, error });
        const errorMessage = error?.message || 'Unknown error';
        toast.error(`Failed to process row ${row.id}: ${errorMessage}`);
        if (row.id) {
          setRowErrors((prev) => ({ ...prev, [row.id!]: errorMessage }));
        }
      } finally {
        debugLog('Auto-save completed', { rowId: row.id, externalId: row.externalId });
        setPendingRowIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id!);
          return next;
        });
      }
    },
    [handleUpdateRow]
  );

  useEffect(() => {
    if (!canResolveReferences) {
      debugLog('Reference data not ready; auto-save paused');
      return;
    }

    editableData.forEach((row) => {
      if (!row.id || pendingRowIds.has(row.id)) {
        return;
      }
      const invalid = computeInvalidFields(row);
      if (invalid.size === 0) {
        setRowErrors((prev) => {
          if (!row.id || !prev[row.id]) {
            return prev;
          }
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
        debugLog('Auto-save triggered via effect', { rowId: row.id, externalId: row.externalId });
        autoSaveRow(row);
      } else {
        debugLog('Row still invalid after refresh', {
          rowId: row.id,
          invalid: Array.from(invalid),
        });
      }
    });
  }, [canResolveReferences, editableData, computeInvalidFields, autoSaveRow, pendingRowIds]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (editableData.length === 0) {
    return null;
  }

  const getColumnOptions = (columnName: string, rowData: ImportHistoryDTO): Option[] | null => {
    switch (columnName) {
      case 'Customer name':
        return customerOptions.map((c) => ({
          value: c.customerBusinessName,
          label: c.customerBusinessName,
        }));
      case 'Product Name':
        return productOptions.map((p) => ({ value: p.name, label: p.name }));
      case 'Call Type':
        return calltypeOptions.map((ct) => ({ value: ct.name, label: ct.name }));
      case 'Sub Call Type':
        const selectedCallType = calltypeOptions.find((ct) => ct.name === rowData['callType']);
        if (!selectedCallType) return [];
        return subcalltypeOptions
          .filter((sct) => sct.callType?.id === selectedCallType.id)
          .map((sct) => ({ value: sct.name, label: sct.name }));
      case 'Priority':
        return priorityOptions.map((p) => ({ value: p.name, label: p.name }));
      case 'Call Status':
        return callstatusOptions.map((cs) => ({ value: cs.name, label: cs.name }));
      default:
        return null;
    }
  };

  const headerMapping: { [key: string]: keyof ImportHistoryDTO } = {
    'Customer name': 'customerBusinessName',
    'Zip Code': 'zipCode',
    'Product Name': 'productName',
    'External Id': 'externalId',
    'Call Type': 'callType',
    'Sub Call Type': 'subCallType',
    Priority: 'priority',
    'Call Status': 'callStatus',
    Reason: 'issue',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between space-y-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="flex items-center gap-2">
              Failed Import Entries
              <Badge variant="destructive">{totalItems}</Badge>
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              disabled={!editableData.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFailedEntries}
              disabled={isClearing || isLoading}
            >
              {isClearing ? 'Clearing...' : 'Clear All Failed Entries'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
            <div className="table-scroll overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    {HEADERS.map((header) => (
                      <TableHead
                        key={header}
                        className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm"
                      >
                        {header}
                      </TableHead>
                    ))}
                    <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((row, rowIndex) => {
                    const invalidFields = computeInvalidFields(row);
                    const computedIssues = getComputedIssues(row, invalidFields);
                    const rowError = row.id ? rowErrors[row.id] : undefined;
                    const allIssues = [...computedIssues];
                    if (rowError && !allIssues.includes(rowError)) {
                      allIssues.push(rowError);
                    }

                    const rowSaving = row.id ? pendingRowIds.has(row.id) : false;
                    const rowHasInvalid = invalidFields.size > 0;
                    const rowNeedsAttention = allIssues.length > 0;
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          rowHasInvalid && 'bg-red-50/40',
                          !rowHasInvalid && rowNeedsAttention && 'bg-amber-50/80'
                        )}
                      >
                        {HEADERS.map((header, cellIndex) => {
                          const fieldName = headerMapping[header];
                          const options = getColumnOptions(header, row);
                          const isReasonColumn = header === 'Reason';

                          return (
                            <TableCell
                              key={header}
                              className={`px-2 sm:px-3 py-2 text-sm align-top ${
                                cellIndex === HEADERS.length - 1
                                  ? 'whitespace-pre-wrap min-w-[280px]'
                                  : 'min-w-[200px]'
                              }`}
                            >
                              {isReasonColumn ? (
                                <span
                                  className={cn(
                                    'text-sm whitespace-pre-line',
                                    allIssues.length
                                      ? 'text-red-600 font-medium'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {allIssues.length ? allIssues.join('\n') : row.issue || '—'}
                                </span>
                              ) : options ? (
                                <SearchableSelect
                                  value={(row[fieldName] as string) || ''}
                                  options={options}
                                  placeholder={`Select ${header}`}
                                  onSelect={(value) =>
                                    handleFieldChange(rowIndex, fieldName, value)
                                  }
                                  disabled={rowSaving}
                                  invalid={invalidFields.has(fieldName)}
                                />
                              ) : (
                                <Input
                                  value={(row[fieldName] as string) || ''}
                                  onChange={(e) =>
                                    handleFieldChange(rowIndex, fieldName, e.target.value)
                                  }
                                  className={cn(
                                    'h-8 text-xs',
                                    invalidFields.has(fieldName) &&
                                      'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                                  )}
                                  disabled={rowSaving}
                                />
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-2 sm:px-3 py-2 text-sm min-w-[140px]">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowHasInvalid || rowSaving || !canResolveReferences}
                            onClick={() => {
                              if (!row.id) return;
                              setRowErrors((prev) => {
                                if (!row.id || !prev[row.id]) {
                                  return prev;
                                }
                                const next = { ...prev };
                                delete next[row.id];
                                return next;
                              });
                              debugLog('Manual update clicked', { rowId: row.id });
                              autoSaveRow(row);
                            }}
                          >
                            {rowSaving ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving
                              </span>
                            ) : (
                              'Update Row'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <AdvancedPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageInput
            showItemsInfo
            showFirstLastButtons
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
}
