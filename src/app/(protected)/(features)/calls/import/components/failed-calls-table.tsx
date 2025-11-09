'use client';

import { useCreateCall, usePartialUpdateCall, getAllCalls, useGetAllPriorities, useGetAllCallTypes, useGetAllSubCallTypes, useGetAllCustomers, useGetAllProducts, useGetAllCallStatuses } from '@/core/api/generated/spring';
import {
  useCountImportHistories,
  useDeleteImportHistory,
  useGetAllImportHistories,
  getAllImportHistories,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { useQueryClient } from '@tanstack/react-query';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { AdvancedPagination, usePaginationState } from './advanced-pagination';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  'Issue',
];

export function FailedCallsTable() {
  const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
  const [editableData, setEditableData] = useState<ImportHistoryDTO[]>([]);
  const [isClearing, setIsClearing] = useState(false);

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

  const { mutate: createCall, isPending: isCreating } = useCreateCall({
    mutation: {
      onError: (error) => {
        toast.error('Failed to create call: ' + error.message);
      },
    },
  });

  const { mutate: partialUpdateCall, isPending: isUpdating } = usePartialUpdateCall({
    mutation: {
      onError: (error) => {
        toast.error('Failed to update call: ' + error.message);
      },
    },
  });

  const { mutate: deleteImportHistory } = useDeleteImportHistory({
    mutation: {
      onError: (error) => {
        toast.error('Failed to delete import history entry: ' + error.message);
      },
    },
  });

  // Debounce utility function
  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<F>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    }) as F;
  };

  const handleClearAllFailedEntries = async () => {
    setIsClearing(true);
    try {
      // Fetch all import history entries
      const allFailedEntries = await getAllImportHistories({ page: 0, size: 1000000 });

      if (allFailedEntries && allFailedEntries.length > 0) {
        // Delete each entry
        for (const entry of allFailedEntries) {
          if (entry.id) {
            await deleteImportHistory({ id: entry.id });
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

  const handleUpdateRow = useCallback(
    async (item: ImportHistoryDTO) => {
      if (!item?.id) return;

      const callDTO = {
        customer: customerOptions.find(
          (c) => c.customerBusinessName === item.customerBusinessName
        ),
        product: productOptions.find((p) => p.name === item.productName),
        callType: calltypeOptions.find((ct) => ct.name === item.callType),
        subCallType: subcalltypeOptions.find((sct) => sct.name === item.subCallType),
        priority: priorityOptions.find((p) => p.name === item.priority),
        callStatus: callstatusOptions.find((cs) => cs.name === item.callStatus),
        externalId: item.externalId,
      };

      try {
        // Check if a Call with this externalId already exists
        const existingCallsResponse = await getAllCalls({ 'externalId.equals': item.externalId });
        const existingCall = existingCallsResponse?.[0];

        if (existingCall && existingCall.id) {
          // If Call exists, update it
          await partialUpdateCall({ id: existingCall.id, data: callDTO });
          toast.success(`Call with external ID ${item.externalId} updated.`);
        } else {
          // If Call does not exist, create a new one
          await createCall({ data: callDTO });
          toast.success(`Call created with external ID ${item.externalId}.`);
        }

        // On success, delete the import history entry
        deleteImportHistory(
          { id: item.id! },
          {
            onSuccess: () => {
              refetch();
            },
          }
        );
      } catch (error: any) {
        toast.error('Failed to process call: ' + (error.message || 'Unknown error'));
      }
    },
    [
      createCall,
      partialUpdateCall,
      deleteImportHistory,
      refetch,
      customerOptions,
      productOptions,
      calltypeOptions,
      subcalltypeOptions,
      priorityOptions,
      callstatusOptions,
    ]
  );

  const debouncedUpdateRow = useRef(debounce(handleUpdateRow, 500)).current;

  const handleFieldChange = (
    rowIndex: number,
    fieldName: keyof ImportHistoryDTO,
    value: any,
    isSelect: boolean = false
  ) => {
    const updatedData = [...editableData];
    const item = updatedData[rowIndex];
    if (item) {
      (item[fieldName] as any) = value;

      if (fieldName === 'callType') {
        item['subCallType'] = '';
      }
      setEditableData(updatedData);

      if (isSelect) {
        handleUpdateRow(item);
      } else {
        debouncedUpdateRow(item);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (editableData.length === 0) {
    return null;
  }

  const getColumnOptions = (columnName: string, rowData: any) => {
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
    Issue: 'issue',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Failed Import Entries
            <Badge variant="destructive">{totalItems}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllFailedEntries}
            disabled={isClearing || isLoading}
          >
            {isClearing ? 'Clearing...' : 'Clear All Failed Entries'}
          </Button>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((row, rowIndex) => (
                    <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                      {HEADERS.map((header, cellIndex) => {
                        const fieldName = headerMapping[header];
                        const options = getColumnOptions(header, row);
                        const isIssueColumn = header.toLowerCase() === 'issue';
                        return (
                          <TableCell
                            key={header}
                            className={`px-2 sm:px-3 py-2 text-sm align-top ${cellIndex === HEADERS.length - 1 ? 'whitespace-nowrap min-w-[400px]' : 'min-w-[200px]'}`}
                          >
                            {isIssueColumn ? (
                              <span className="text-red-600 font-medium whitespace-nowrap">
                                {row[fieldName]}
                              </span>
                            ) : options ? (
                              <Select
                                value={row[fieldName] || ''}
                                onValueChange={(value) =>
                                  handleFieldChange(rowIndex, fieldName, value, true)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${header}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={row[fieldName] || ''}
                                onChange={(e) =>
                                  handleFieldChange(rowIndex, fieldName, e.target.value, false)
                                }
                                className="h-8 text-xs"
                              />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
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
