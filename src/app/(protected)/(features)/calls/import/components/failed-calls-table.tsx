
// ===============================================================
// 🛑 NEW FILE – CUSTOMIZATION ALLOWED 🛑
// - Purpose: Display and edit failed call import entries in a table
// ===============================================================

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Data fetching hooks from call-table.tsx
import { useGetAllPriorities } from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';
import { useGetAllCallTypes } from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import { useGetAllSubCallTypes } from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';
import { useGetAllCustomers } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useGetAllCallStatuses } from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';

import { useCreateCall } from '@/core/api/generated/spring';

interface FailedCallsTableProps {
    errorReportCsv: string;
}

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

export function FailedCallsTable({ errorReportCsv }: FailedCallsTableProps) {
    const [headers, setHeaders] = useState<string[]>([]);
    const [editableData, setEditableData] = useState<any[]>([]);

    useEffect(() => {
        if (!errorReportCsv) return;
        try {
            const workbook = XLSX.read(errorReportCsv, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

            if (jsonData.length < 1) return;

            const parsedHeaders = jsonData[0] as string[];
            setHeaders(parsedHeaders);

            const parsedData = jsonData.slice(1).map((row: any[], index) => {
                const rowData: { [key: string]: any } = { id: index }; // Add a unique id for react key
                parsedHeaders.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });
            setEditableData(parsedData);
        } catch (error) {
            console.error('Failed to parse error report CSV:', error);
        }
    }, [errorReportCsv]);

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

    const handleFieldChange = (rowIndex: number, fieldName: string, value: any) => {
        const updatedData = [...editableData];
        updatedData[rowIndex][fieldName] = value;

        if (fieldName === 'Call Type') {
            updatedData[rowIndex]['Sub Call Type'] = '';
        }
        setEditableData(updatedData);
    };

    const handleUpdateRow = (rowIndex: number) => {
        const rowData = editableData[rowIndex];

        // Map form data to CallDTO
        const callDTO = {
            customer: customerOptions.find(c => c.customerBusinessName === rowData['Customer name']),
            product: productOptions.find(p => p.name === rowData['Product Name']),
            callType: calltypeOptions.find(ct => ct.name === rowData['Call Type']),
            subCallType: subcalltypeOptions.find(sct => sct.name === rowData['Sub Call Type']),
            priority: priorityOptions.find(p => p.name === rowData['Priority']),
            callStatus: callstatusOptions.find(cs => cs.name === rowData['Call Status']),
            // Assuming other fields like leadNo are not present in the failed import to be created
        };

        // @ts-ignore
        createCall({ data: callDTO }, {
            onSuccess: () => {
                toast.success(`Row ${rowIndex + 1} updated and removed.`);
                setEditableData(prevData => prevData.filter((_, index) => index !== rowIndex));
            }
        });
    };

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
                const selectedCallType = calltypeOptions.find(ct => ct.name === rowData['Call Type']);
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

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Failed Import Entries
                        <Badge variant="destructive">{editableData.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
                        <div className="table-scroll overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="border-b border-gray-200 bg-gray-50">
                                        {headers.map((header) => (
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
                                            {headers.map((header, cellIndex) => {
                                                const options = getColumnOptions(header, row);
                                                const isIssueColumn = header.toLowerCase() === 'issue';
                                                return (
                                                    <TableCell
                                                        key={header}
                                                        className={`px-2 sm:px-3 py-2 text-sm align-top ${cellIndex === headers.length - 1 ? 'whitespace-normal' : 'min-w-[200px]'}`}>
                                                        {isIssueColumn ? (
                                                            <span className='text-red-600 font-medium'>{row[header]}</span>
                                                        ) : options ? (
                                                            <Select
                                                                value={row[header] || ''}
                                                                onValueChange={(value) => handleFieldChange(rowIndex, header, value)}>
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
                                                                value={row[header] || ''}
                                                                onChange={(e) => handleFieldChange(rowIndex, header, e.target.value)}
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
                </CardContent>
            </Card>
        </>
    );
}
