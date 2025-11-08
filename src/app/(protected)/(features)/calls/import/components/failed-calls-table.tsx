// ===============================================================
// 🛑 NEW FILE – CUSTOMIZATION ALLOWED 🛑
// - Purpose: Display and edit failed call import entries in a table
// ===============================================================

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Data fetching hooks
import { useGetAllPriorities } from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';
import { useGetAllCallTypes } from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import { useGetAllSubCallTypes } from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';
import { useGetAllCustomers } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useGetAllCallStatuses } from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';
import { useGetAllImportHistories, useCountImportHistories, useDeleteImportHistory } from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { useCreateCall } from '@/core/api/generated/spring';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import {AdvancedPagination, usePaginationState} from './advanced-pagination';

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
    'Issue'
];


export function FailedCallsTable() {
    const { page, pageSize, handlePageChange, handlePageSizeChange } = usePaginationState(1, 10);
    const [editableData, setEditableData] = useState<ImportHistoryDTO[]>([]);

    const apiPage = Math.max(page - 1, 0);

    const { data: importHistoryData, isLoading, refetch } = useGetAllImportHistories({
        page: apiPage,
        size: pageSize,
        sort: ['id,asc']
    });

    const { data: totalCount = 0 } = useCountImportHistories({});
    const totalItems = totalCount ?? 0;

    useEffect(() => {
        if (importHistoryData) {
            setEditableData(importHistoryData);
        }
    }, [importHistoryData]);

    // Fetch data for dropdowns
    const { data: priorityOptions = [] } = useGetAllPriorities({ page: 0, size: 1000 });
    const { data: calltypeOptions = [] } = useGetAllCallTypes({ page: 0, size: 1000 });
    const { data: subcalltypeOptions = [] } = useGetAllSubCallTypes({ page: 0, size: 1000 });
    const { data: customerOptions = [] } = useGetAllCustomers({ page: 0, size: 1000 });
    const { data: productOptions = [] } = useGetAllProducts({ page: 0, size: 1000 });
    const { data: callstatusOptions = [] } = useGetAllCallStatuses({ page: 0, size: 1000 });

    const { mutate: createCall, isPending: isCreating } = useCreateCall({
        mutation: {
            onError: (error) => {
                toast.error('Failed to update call: ' + error.message);
            },
        },
    });

    const { mutate: deleteImportHistory } = useDeleteImportHistory({});

    const handleFieldChange = (rowIndex: number, fieldName: keyof ImportHistoryDTO, value: any) => {
        const updatedData = [...editableData];
        const item = updatedData[rowIndex];
        if (item) {
            (item[fieldName] as any) = value;

            if (fieldName === 'callType') {
                item['subCallType'] = '';
            }
            setEditableData(updatedData);
        }
    };

    const handleUpdateRow = (rowIndex: number) => {
        const rowData = editableData[rowIndex];
        if (!rowData?.id) return;

        const callDTO = {
            customer: customerOptions.find(c => c.customerBusinessName === rowData.customerBusinessName),
            product: productOptions.find(p => p.name === rowData.productName),
            callType: calltypeOptions.find(ct => ct.name === rowData.callType),
            subCallType: subcalltypeOptions.find(sct => sct.name === rowData.subCallType),
            priority: priorityOptions.find(p => p.name === rowData.priority),
            callStatus: callstatusOptions.find(cs => cs.name === rowData.callStatus),
            externalId: rowData.externalId
        };

        // @ts-ignore
        createCall({ data: callDTO }, {
            onSuccess: () => {
                toast.success(`Row ${rowIndex + 1} updated and call created.`);
                deleteImportHistory({ id: rowData.id! }, {
                    onSuccess: () => {
                        refetch();
                    }
                });
            }
        });
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
                return customerOptions.map(c => ({ value: c.customerBusinessName, label: c.customerBusinessName }));
            case 'Product Name':
                return productOptions.map(p => ({ value: p.name, label: p.name }));
            case 'Call Type':
                return calltypeOptions.map(ct => ({ value: ct.name, label: ct.name }));
            case 'Sub Call Type':
                const selectedCallType = calltypeOptions.find(ct => ct.name === rowData['callType']);
                if (!selectedCallType) return [];
                return subcalltypeOptions
                    .filter(sct => sct.callType?.id === selectedCallType.id)
                    .map(sct => ({ value: sct.name, label: sct.name }));
            case 'Priority':
                return priorityOptions.map(p => ({ value: p.name, label: p.name }));
            case 'Call Status':
                return callstatusOptions.map(cs => ({ value: cs.name, label: cs.name }));
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
        'Priority': 'priority',
        'Call Status': 'callStatus',
        'Issue': 'issue'
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Failed Import Entries
                        <Badge variant="destructive">{totalItems}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
                        <div className="table-scroll overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="border-b border-gray-200 bg-gray-50">
                                        {HEADERS.map((header) => (
                                            <TableHead key={header} className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm">
                                                {header}
                                            </TableHead>
                                        ))}
                                        <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm text-center">Actions</TableHead>
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
                                                        className={`px-2 sm:px-3 py-2 text-sm align-top ${cellIndex === HEADERS.length - 1 ? 'whitespace-nowrap min-w-[400px]' : 'min-w-[200px]'}`}>
                                                        {isIssueColumn ? (
                                                            <span className='text-red-600 font-medium whitespace-nowrap'>{row[fieldName]}</span>
                                                        ) : options ? (
                                                            <Select
                                                                value={row[fieldName] || ''}
                                                                onValueChange={(value) => handleFieldChange(rowIndex, fieldName, value)}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={`Select ${header}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.map(opt => (
                                                                        <SelectItem key={opt.value} value={opt.value}>
                                                                            {opt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                value={row[fieldName] || ''}
                                                                onChange={(e) => handleFieldChange(rowIndex, fieldName, e.target.value)}
                                                                className="h-8 text-xs" />
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="px-2 sm:px-3 py-2 text-center align-middle">
                                                <Button variant="default" size="sm" onClick={() => handleUpdateRow(rowIndex)} disabled={isCreating}>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {isCreating ? 'Updating...' : 'Update'}
                                                </Button>
                                            </TableCell>
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
