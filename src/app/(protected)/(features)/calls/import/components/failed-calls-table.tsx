'use client';

import {
  useGetAllPriorities,
  useGetAllCallTypes,
  useGetAllSubCallTypes,
  useGetAllCustomers,
  useGetAllProducts,
  useGetAllCallStatuses,
} from '@/core/api/generated/spring';
import {
  useCountImportHistories,
  useDeleteAllCallImportHistories,
  useGetAllImportHistories,
  useProcessImportHistory,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { useSearchGeography } from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { AdvancedPagination, usePaginationState } from './advanced-pagination';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { callImportConfig } from '../config';

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
  'Customer Phone Number',
  'Zip Code',
  'Product Name',
  'Product Code',
  'External Id',
  'Call Type',
  'Sub Call Type',
  'Priority',
  'Call Status',
  'Remark',
  'Reason',
];

type Option = { value: string; label: string };

const TEMPLATE_FIELD_ORDER: Array<keyof ImportHistoryDTO> = [
  'externalId',
  'customerBusinessName',
  'phoneNumber',
  'zipCode',
  'productName',
  'productCode',
  'callType',
  'subCallType',
  'priority',
  'callStatus',
  'remark',
];

const normalizeKey = (value?: string | null) => value?.trim().toLowerCase() ?? '';
const buildSubCallTypeKey = (callTypeId: number, name: string) => `${callTypeId}:${normalizeKey(name)}`;

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
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
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
  const [pendingRowIds, setPendingRowIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [rowToSave, setRowToSave] = useState<(ImportHistoryDTO & { customerIsNew?: boolean; productIsNew?: boolean }) | null>(null);
  const [pincodeValidationCache, setPincodeValidationCache] = useState<Record<string, boolean>>({});
  const [autoTriggeredRows, setAutoTriggeredRows] = useState<Set<number>>(new Set());
  const isProcessingAutoTrigger = useRef(false);

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
      setEditableData(importHistoryData.filter(item => item.issue && item.issue.trim() !== ''));
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

  // Pincode validation helper
  const validatePincodeFormat = useCallback((pincode: string): boolean => {
    const PINCODE_REGEX = /^[0-9]{6}$/;
    return PINCODE_REGEX.test(pincode?.trim() || '');
  }, []);

  const validatePincodeExists = useCallback(async (pincode: string): Promise<boolean> => {
    // Check cache first
    if (pincodeValidationCache[pincode] !== undefined) {
      return pincodeValidationCache[pincode];
    }

    try {
      // Import searchGeography function directly
      const { searchGeography } = await import('@/core/api/generated/spring/endpoints/area-resource/area-resource.gen');
      const areas = await searchGeography({ term: pincode, size: 1 });
      const isValid = Boolean(
        areas &&
        areas.length > 0 &&
        areas[0].pincode === pincode &&
        areas[0].status === 'ACTIVE'
      );

      // Cache the result
      setPincodeValidationCache(prev => ({ ...prev, [pincode]: isValid }));
      return isValid;
    } catch (error) {
      debugLog('Pincode validation error', { pincode, error });
      return false;
    }
  }, [pincodeValidationCache]);

  const computeInvalidFields = useCallback(
    (row: ImportHistoryDTO) => {
      const invalid = new Set<keyof ImportHistoryDTO>();

      // Customer validation: Only check if name is provided (auto-create if not exists)
      if (!row.customerBusinessName || row.customerBusinessName.trim().length === 0) {
        invalid.add('customerBusinessName');
      }

      // Product validation: Only check if name is provided (auto-create if not exists)
      if (!row.productName || row.productName.trim().length === 0) {
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

      // SubCallType validation: Check if subcalltypes are available for the CallType
      if (callType?.id) {
        const availableSubCallTypes = subcalltypeOptions.filter(
          (sct) => sct.callType?.id === callType.id
        );

        if (availableSubCallTypes.length > 0) {
          // SubCallTypes exist for this CallType - SubCallType is REQUIRED
          if (!row.subCallType || row.subCallType.trim().length === 0) {
            invalid.add('subCallType');
          } else {
            // Validate the provided SubCallType matches
            const subKey = buildSubCallTypeKey(callType.id, row.subCallType);
            const match = subCallTypeMap.get(subKey) ||
              availableSubCallTypes.find(
                (sct) => normalizeKey(sct.name) === normalizeKey(row.subCallType)
              );
            if (!match) {
              invalid.add('subCallType');
            }
          }
        }
        // If no subcalltypes available, SubCallType is not required (N/A case)
      } else if (row.subCallType) {
        // No callType selected yet but subCallType is provided
        const resolvedSubCallType = subcalltypeOptions.find(
          (sct) => normalizeKey(sct.name) === normalizeKey(row.subCallType)
        );
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

      // Enhanced zipcode validation: Only required for NEW customers
      const isNewCustomer = !customerMap.has(normalizeKey(row.customerBusinessName));
      if (isNewCustomer) {
        // Zipcode is required for new customers
        if (!row.zipCode || row.zipCode.trim().length === 0) {
          invalid.add('zipCode');
        } else if (!validatePincodeFormat(row.zipCode)) {
          invalid.add('zipCode');
        }
        // Note: Async pincode existence check will be done in handleSaveRow
      }

      // External ID is optional in the template; leave it blank if importer didn't supply one

      return invalid;
    },
    [
      callTypeMap,
      subCallTypeMap,
      priorityMap,
      callStatusMap,
      calltypeOptions,
      subcalltypeOptions,
      validatePincodeFormat,
      customerMap,
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
            issues.push('Customer name is required.');
            break;
          case 'productName':
            issues.push('Product name is required.');
            break;
          case 'callType':
            issues.push('Call Type mismatch. Please select a valid Call Type.');
            break;
          case 'subCallType':
            if (!row.subCallType || row.subCallType.trim().length === 0) {
              issues.push('Sub Call Type is required for the selected Call Type.');
            } else {
              issues.push('Sub Call Type must belong to the selected Call Type.');
            }
            break;
          case 'priority':
            issues.push('Priority is required and must match master data.');
            break;
          case 'callStatus':
            issues.push('Call Status is required and must match master data.');
            break;
          case 'zipCode':
            if (!row.zipCode || row.zipCode.trim().length === 0) {
              issues.push('Zip Code is required for new customers.');
            } else if (!validatePincodeFormat(row.zipCode)) {
              issues.push('Zip Code must be exactly 6 digits.');
            }
            // Additional async check for existence will be done in handleSaveRow
            break;
          default:
            break;
        }
      });
      return issues;
    },
    [canResolveReferences, validatePincodeFormat]
  );
  const {
    mutateAsync: deleteAllCallImportHistoriesAsync,
    isPending: isClearingAllFailedEntries,
  } = useDeleteAllCallImportHistories({
    mutation: {
      onError: (error) => {
        toast.error('Failed to clear all failed import entries: ' + error.message);
      },
    },
  });
  const isClearing = isClearingAllFailedEntries;

  const { mutateAsync: processImportHistoryAsync } = useProcessImportHistory();

  const handleClearAllFailedEntries = async () => {
    try {
      const response = await deleteAllCallImportHistoriesAsync();
      const deletedCount = Number((response as any)?.deletedCount ?? 0);
      const message = typeof (response as any)?.message === 'string' ? (response as any).message : undefined;

      if (deletedCount > 0) {
        toast.success(message ?? `Deleted ${deletedCount} failed import entr${deletedCount === 1 ? 'y' : 'ies'}.`);
      } else {
        toast.info(message ?? 'No failed import entries to clear.');
      }
      refetch();
    } catch (error) {
      debugLog('Failed to clear all failed import entries', error);
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


  const processRow = useCallback(
    async (row: ImportHistoryDTO) => {
      if (!row?.id) {
        return;
      }

      let shouldProcess = true;
      setPendingRowIds((prev) => {
        if (prev.has(row.id!)) {
          shouldProcess = false;
          return prev;
        }
        const next = new Set(prev);
        next.add(row.id!);
        return next;
      });

      if (!shouldProcess) {
        debugLog('Row already processing, skipping queue', { rowId: row.id });
        return;
      }

      debugLog('Processing row via processImportHistory', { rowId: row.id, payload: row });
      try {
        await processImportHistoryAsync({ id: row.id, data: row });
        setEditableData((prev) => prev.filter((item) => item.id !== row.id));
        refetch();
        toast.success('Call data saved successfully.');
        debugLog('Row processed successfully', { rowId: row.id });
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        toast.error(`Failed to process row ${row.id}: ${errorMessage}`);
        if (row.id) {
          setRowErrors((prev) => ({ ...prev, [row.id!]: errorMessage }));
        }
        debugLog('Row processing failed', { rowId: row.id, error });
      } finally {
        setPendingRowIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id!);
          return next;
        });
      }
    },
    [processImportHistoryAsync, refetch]
  );

  const handleFieldChange = (rowIndex: number, fieldName: keyof ImportHistoryDTO, value: string) => {
    setEditableData((prev) => {
      const updated = [...prev];
      const original = updated[rowIndex];
      if (!original) {
        return prev;
      }

      const current = { ...original } as ImportHistoryDTO;
      (current[fieldName] as any) = value;

      // When CallType changes, update SubCallType accordingly
      if (fieldName === 'callType') {
        const selectedCallType = calltypeOptions.find(
          (ct) => normalizeKey(ct.name) === normalizeKey(value)
        );

        if (selectedCallType?.id) {
          const availableSubCallTypes = subcalltypeOptions.filter(
            (sct) => sct.callType?.id === selectedCallType.id
          );

          if (availableSubCallTypes.length === 0) {
            // No subcalltypes available - set to empty (will display as N/A)
            current.subCallType = '';
          } else {
            // Subcalltypes available - clear to force user selection
            current.subCallType = '';
          }
        } else {
          current.subCallType = '';
        }
      }

      updated[rowIndex] = current;
      return updated;
    });

    // Clear any previous errors for this row
    setEditableData((prev) => {
      const row = prev[rowIndex];
      if (row?.id && rowErrors[row.id]) {
        setRowErrors((prevErrors) => {
          const next = { ...prevErrors };
          delete next[row.id!];
          return next;
        });
      }
      return prev;
    });

    debugLog('Field updated - no auto-save', { rowIndex, fieldName, value });
  };

  // New function to handle save with validation and confirmation
  const handleSaveRow = useCallback(async (row: ImportHistoryDTO) => {
    if (!row?.id) return;

    // Client-side validation first
    const invalid = computeInvalidFields(row);
    if (invalid.size > 0) {
      const issues = getComputedIssues(row, invalid);
      toast.error('Please fix all validation errors before saving:\n' + issues.join('\n'));
      return;
    }

    // Check if customer/product will be auto-created
    const customerIsNew = !customerMap.has(normalizeKey(row.customerBusinessName));
    const productIsNew = !productMap.has(normalizeKey(row.productName));

    // Async pincode validation for new customers
    if (customerIsNew && row.zipCode) {
      const pincodeValid = await validatePincodeExists(row.zipCode);
      if (!pincodeValid) {
        toast.error('Zip Code is not a valid area pincode in the system. Please verify and try again.');
        return;
      }
    }

    // Show confirmation dialog
    setRowToSave({ ...row, customerIsNew, productIsNew });
    setShowSaveDialog(true);
  }, [computeInvalidFields, getComputedIssues, customerMap, productMap, validatePincodeExists]);

  // Confirm and process the row
  const confirmSaveRow = useCallback(async () => {
    if (!rowToSave?.id) return;

    try {
      setPendingRowIds((prev) => {
        const next = new Set(prev);
        next.add(rowToSave.id!);
        return next;
      });

      await processImportHistoryAsync({ id: rowToSave.id, data: rowToSave });

      // Remove from local state
      setEditableData((prev) => prev.filter((item) => item.id !== rowToSave.id));

      // Update pagination if needed
      const newTotalItems = totalItems - 1;
      if (editableData.length === 1 && page > 1) {
        handlePageChange(page - 1);
      } else {
        refetch();
      }

      toast.success(
        `Call saved successfully. ${rowToSave.customerBusinessName} - ${rowToSave.productName}`,
        { duration: 5000 }
      );

      setShowSaveDialog(false);
      setRowToSave(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
      if (rowToSave.id) {
        setRowErrors((prev) => ({ ...prev, [rowToSave.id!]: errorMessage }));
      }
    } finally {
      setPendingRowIds((prev) => {
        const next = new Set(prev);
        next.delete(rowToSave.id!);
        return next;
      });
    }
  }, [rowToSave, processImportHistoryAsync, editableData, totalItems, page, handlePageChange, refetch]);

  // Auto-trigger save dialog for rows with N/A subcalltype that become valid
  useEffect(() => {
    // Prevent infinite loops and duplicate processing
    if (!canResolveReferences || showSaveDialog || editableData.length === 0 || isProcessingAutoTrigger.current) {
      return;
    }

    // Find first row that is valid and has N/A subcalltype (not already auto-triggered)
    for (const row of editableData) {
      if (!row.id || autoTriggeredRows.has(row.id) || pendingRowIds.has(row.id)) {
        continue;
      }

      // Check if row is valid
      const invalid = computeInvalidFields(row);
      if (invalid.size > 0) {
        continue;
      }

      // Check if this row has N/A subcalltype scenario
      const callType = calltypeOptions.find(
        (ct) => normalizeKey(ct.name) === normalizeKey(row.callType)
      );

      if (callType?.id) {
        const availableSubCallTypes = subcalltypeOptions.filter(
          (sct) => sct.callType?.id === callType.id
        );

        if (availableSubCallTypes.length === 0 && (!row.subCallType || row.subCallType.trim().length === 0)) {
          // This row is valid with N/A subcalltype - auto-trigger save dialog
          isProcessingAutoTrigger.current = true;
          setAutoTriggeredRows((prev) => new Set(prev).add(row.id!));
          handleSaveRow(row);
          // Reset flag after a short delay to allow for next processing
          setTimeout(() => {
            isProcessingAutoTrigger.current = false;
          }, 500);
          break; // Only trigger one at a time
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableData, canResolveReferences, showSaveDialog, autoTriggeredRows, pendingRowIds, calltypeOptions, subcalltypeOptions]);

  // Removed general auto-trigger functionality - user must manually click "Save Row" button

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
        const subOptions = subcalltypeOptions
          .filter((sct) => sct.callType?.id === selectedCallType.id)
          .map((sct) => ({ value: sct.name, label: sct.name }));
        if (subOptions.length === 0) {
          return [{ value: '', label: 'N/A' }];
        }
        return subOptions;
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
    'Customer Phone Number': 'phoneNumber',
    'Zip Code': 'zipCode',
    'Product Name': 'productName',
    'Product Code': 'productCode',
    'External Id': 'externalId',
    'Call Type': 'callType',
    'Sub Call Type': 'subCallType',
    Priority: 'priority',
    'Call Status': 'callStatus',
    Remark: 'remark',
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
            <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={!editableData.length}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClearing || isLoading}
                >
                  {isClearing ? 'Clearing...' : 'Clear All Failed Entries'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete failed entries?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It would delete all your history this action cannot be undo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllFailedEntries} disabled={isClearing}>
                    {isClearing ? 'Clearing...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                    const isValidated = !rowHasInvalid && !rowNeedsAttention;

                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'transition-colors',
                          rowHasInvalid && 'bg-red-50/40 hover:bg-red-50/50',
                          !rowHasInvalid && rowNeedsAttention && 'bg-amber-50/80 hover:bg-amber-50/90',
                          isValidated && 'bg-green-100/60 hover:bg-green-100/70'
                        )}
                      >
                        {HEADERS.map((header, cellIndex) => {
                          const fieldName = headerMapping[header];
                          const options = getColumnOptions(header, row);
                          const isReasonColumn = header === 'Reason';
                          const isRemarkColumn = header === 'Remark';

                          return (
                            <TableCell
                              key={header}
                              className={`px-2 sm:px-3 py-2 text-sm align-top ${
                                cellIndex === HEADERS.length - 1
                                  ? 'min-w-[280px]'
                                  : 'min-w-[200px]'
                              }`}
                            >
                              {isReasonColumn ? (
                                allIssues.length > 0 ? (
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={cn(
                                            'text-sm cursor-help text-red-600 font-medium truncate block max-w-[260px]'
                                          )}
                                        >
                                          {allIssues.join(', ')}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="left"
                                        className="max-w-md p-3 bg-white border shadow-lg"
                                      >
                                        <div className="space-y-1">
                                          <p className="font-semibold text-sm text-red-700 mb-2">
                                            Validation Errors:
                                          </p>
                                          <ul className="list-disc pl-4 space-y-1">
                                            {allIssues.map((issue, idx) => (
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
                                  <span className="text-sm text-green-600 font-medium">
                                    No Failures
                                  </span>
                                )
                              ) : options ? (
                                <div className="flex items-center gap-2">
                                  <SearchableSelect
                                    value={(row[fieldName] as string) || ''}
                                    options={options}
                            placeholder={
                              header === 'Sub Call Type' && options.length === 1 && !options[0].value
                                ? 'N/A'
                                : `Select ${header}`
                            }
                                    onSelect={(value) => handleFieldChange(rowIndex, fieldName, value)}
                                    disabled={rowSaving}
                                    invalid={invalidFields.has(fieldName)}
                                  />
                                  {header === 'Customer name' &&
                                    row.customerBusinessName &&
                                    !customerMap.has(normalizeKey(row.customerBusinessName)) && (
                                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                        New
                                      </Badge>
                                    )}
                                  {header === 'Product Name' &&
                                    row.productName &&
                                    !productMap.has(normalizeKey(row.productName)) && (
                                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                        New
                                      </Badge>
                                    )}
                                </div>
                              ) : isRemarkColumn ? (
                                // Special rendering for Remark column with truncation and tooltip
                                row.remark && row.remark.trim().length > 0 ? (
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative">
                                          <Input
                                            value={row.remark || ''}
                                            onChange={(e) => handleFieldChange(rowIndex, fieldName, e.target.value)}
                                            className={cn(
                                              'h-8 text-xs cursor-help truncate pr-8',
                                              invalidFields.has(fieldName) &&
                                                'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                                            )}
                                            disabled={rowSaving}
                                            placeholder="Add remark..."
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                            ...
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="left"
                                        className="max-w-md p-3 bg-white border shadow-lg"
                                      >
                                        <div className="space-y-1">
                                          <p className="font-semibold text-sm text-gray-800 mb-2">
                                            Full Remark:
                                          </p>
                                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                            {row.remark}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <Input
                                    value={row.remark || ''}
                                    onChange={(e) => handleFieldChange(rowIndex, fieldName, e.target.value)}
                                    className={cn(
                                      'h-8 text-xs',
                                      invalidFields.has(fieldName) &&
                                        'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                                    )}
                                    disabled={rowSaving}
                                    placeholder="Add remark..."
                                  />
                                )
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={(row[fieldName] as string) || ''}
                                    onChange={(e) => handleFieldChange(rowIndex, fieldName, e.target.value)}
                                    className={cn(
                                      'h-8 text-xs',
                                      invalidFields.has(fieldName) &&
                                        'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                                    )}
                                    disabled={rowSaving}
                                  />
                                  {header === 'Customer name' &&
                                    row.customerBusinessName &&
                                    !customerMap.has(normalizeKey(row.customerBusinessName)) && (
                                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                        New
                                      </Badge>
                                    )}
                                  {header === 'Product Name' &&
                                    row.productName &&
                                    !productMap.has(normalizeKey(row.productName)) && (
                                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                        New
                                      </Badge>
                                    )}
                                </div>
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
                              debugLog('Save button clicked', { rowId: row.id });
                              handleSaveRow(row);
                            }}
                          >
                            {rowSaving ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving
                              </span>
                            ) : (
                              'Save Row'
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

      {/* Confirmation Dialog for Saving Row */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Save</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to save this call record?</p>
              {rowToSave?.customerIsNew && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <strong className="text-blue-800">New Customer Will Be Created:</strong>
                  <div className="mt-1 text-sm text-blue-700">
                    <div><strong>Business Name:</strong> {rowToSave.customerBusinessName}</div>
                    {rowToSave.phoneNumber && <div><strong>Phone:</strong> {rowToSave.phoneNumber}</div>}
                    <div><strong>Zip Code:</strong> {rowToSave.zipCode}</div>
                  </div>
                </div>
              )}
              {rowToSave?.productIsNew && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <strong className="text-green-800">New Product Will Be Created:</strong>
                  <div className="mt-1 text-sm text-green-700">
                    <div><strong>Product Name:</strong> {rowToSave.productName}</div>
                    {rowToSave.productCode && <div><strong>Product Code:</strong> {rowToSave.productCode}</div>}
                  </div>
                </div>
              )}
              {!rowToSave?.customerIsNew && !rowToSave?.productIsNew && (
                <p className="text-sm text-muted-foreground mt-2">
                  This will create a new call record using existing customer and product data.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingRowIds.has(rowToSave?.id ?? 0)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSaveRow}
              disabled={pendingRowIds.has(rowToSave?.id ?? 0)}
            >
              {pendingRowIds.has(rowToSave?.id ?? 0) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Confirm Save'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
