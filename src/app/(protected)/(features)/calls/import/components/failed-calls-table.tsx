
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

            const parsedData = jsonData.slice(1).map((row: any[]) => {
                const rowData: { [key: string]: any } = {};
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

    const handleFieldChange = (rowIndex: number, fieldName: string, value: any) => {
        const updatedData = [...editableData];
        updatedData[rowIndex][fieldName] = value;

        // If Call Type is changed, reset Sub Call Type
        if (fieldName === 'Call Type') {
            updatedData[rowIndex]['Sub Call Type'] = '';
        }
        setEditableData(updatedData);
    };

    const handleUpdateRow = (rowIndex: number) => {
        const rowData = editableData[rowIndex];
        console.log("Submitting updated row:", rowData);
        toast.success(`Row ${rowIndex + 1} submitted for update.`);
        // TODO: Implement API call to update the record
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
                                        <TableRow key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                            {headers.map((header, cellIndex) => {
                                                const options = getColumnOptions(header, row);
                                                return (
                                                    <TableCell
                                                        key={header}
                                                        className={`px-2 sm:px-3 py-2 text-sm align-top ${cellIndex === headers.length - 1 ? 'whitespace-normal' : 'min-w-[200px]'}`}>
                                                        {options ? (
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
                                                <Button variant="outline" size="sm" onClick={() => handleUpdateRow(rowIndex)}>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Update
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
