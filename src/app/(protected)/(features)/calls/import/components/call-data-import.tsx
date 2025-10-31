// ===============================================================
// 🛑 AUTO-GENERATED INSPIRED FILE – CUSTOMIZATION ALLOWED 🛑
// - Purpose: Display import instructions for Call bulk data and a file input field
// - To customize: Edit directly or use feature-level extensions
// ===============================================================

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {useImportCallsFromExcel} from "@/core/api/generated/spring";
import * as XLSX from 'xlsx';

interface CallDataImportProps {
    // Add props if needed, e.g., for handling file submission
}

interface ImportResponse {
    success: boolean;
    totalRows: number;
    successfulRows: number;
    skippedRows: number;
    failedRows: number;
    skippedErrors: string[];
    failedErrors: string[];
    skippedReportCsv: string;
    errorReportCsv: string;
    message: string;
}

const importConfig = {
    instructions: [
        "Fill in the data starting from row 2 (row 1 contains headers)",
        "Maximum 500 data rows per upload",
        "All fields are required and must match existing master data exactly (no new masters created during import)",
        "Partial import: Only valid rows are added; invalid rows are failed, duplicates are skipped",
        "Download error report CSV from response for failed rows details",
        "Save the file as .xlsx or .xls format"
    ],
    filename: "call_import_template.xlsx",
    columns: [
        {
            header: "Customer name",
            column: "A",
            example: "Wood Business",
            description: "Customer business name (Required) - must match existing customer exactly"
        },
        {
            header: "Zip code",
            column: "B",
            example: "12345",
            description: "Zip code (Required)"
        },
        {
            header: "Product Name",
            column: "C",
            example: "iPhone 15 Pro",
            description: "Product name (Required) - must match existing product exactly"
        },
        {
            header: "Call Type",
            column: "D",
            example: "Customer Support",
            description: "CallType name (Required) - must match existing CallType exactly"
        },
        {
            header: "Sub Call Type",
            column: "E",
            example: "Technical Issue",
            description: "SubCallType name (Required) - must match existing SubCallType and belong to the CallType"
        },
        {
            header: "Priority",
            column: "F",
            example: "High",
            description: "Priority name (Required) - must match existing Priority exactly"
        },
        {
            header: "Call Status",
            column: "G",
            example: "Open",
            description: "CallStatus name (Required) - must match existing CallStatus exactly"
        }
    ],
};

export function CallDataImport({}: CallDataImportProps) {
    const form = useForm({
        defaultValues: {
            importFile: null,
        },
    });
    const router = useRouter();

    // Use the mutation hook from the generated file
    const { mutate: importCalls, isPending: isUploading, error } = useImportCallsFromExcel({
        mutation: {
            onSuccess: (data) => {
                console.log('Import successful:', data);
                // Store response in session storage to pass to the results page
                sessionStorage.setItem('importResponse', JSON.stringify(data));
                // Redirect to the results page
                router.push('/calls/import/results');
                form.reset();
            },
            onError: (err) => {
                console.error('Import failed:', err);
                alert('Import failed: ' + (err?.message || 'Unknown error')); // Replace with error toast
            },
        },
    });

    const handleSubmit = (data: any) => {
        if (!data.importFile) {
            alert('Please select a file');
            return;
        }
        // Call the mutation with the file
        importCalls({ data: { file: data.importFile } });
    };

    const handleDownloadTemplate = () => {
        const wsData = [
            ['Customer name', 'Zip code', 'Product Name', 'Call Type', 'Sub Call Type', 'Priority', 'Call Status'],
            ['Wood Business', '12345', 'iPhone 15 Pro', 'Customer Support', 'Technical Issue', 'High', 'Open'],
            ['ABC Enterprises', '67890', 'Software XYZ', 'Billing Inquiry', 'Payment Issue', 'Medium', 'In Progress'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Calls');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = importConfig.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <h4 className="font-semibold mb-2">Call Data Bulk Import Instructions</h4>
                        <div className="space-y-4">
                            {/* Instructions List */}
                            <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-2">Instructions:</h5>
                                <ul className="list-disc pl-5 text-sm text-foreground">
                                    {importConfig.instructions.map((instruction, index) => (
                                        <li key={index}>{instruction}</li>
                                    ))}
                                </ul>
                            </div>
                            {/* Filename */}
                            <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-2">Template Filename:</h5>
                                <p className="text-sm text-foreground">{importConfig.filename}</p>
                            </div>
                            {/* Columns Table */}
                            <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-2">Columns:</h5>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-border">
                                        <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">
                                                Column
                                            </th>
                                            <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">
                                                Header
                                            </th>
                                            <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">
                                                Example
                                            </th>
                                            <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">
                                                Description
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {importConfig.columns.map((column, index) => (
                                            <tr key={index} className="even:bg-muted/50">
                                                <td className="border border-border p-2 text-sm">{column.column}</td>
                                                <td className="border border-border p-2 text-sm">{column.header}</td>
                                                <td className="border border-border p-2 text-sm">{column.example}</td>
                                                <td className="border border-border p-2 text-sm">{column.description}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Download Template Button */}
                            <div className="pt-4">
                                <Button onClick={handleDownloadTemplate} variant="outline" className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Download Template (.xlsx)
                                </Button>
                            </div>
                        </div>
                        {/* File Input Field */}
                        <FormField
                            control={form.control}
                            name="importFile"
                            render={({ field }) => (
                                <FormItem className="mt-6">
                                    <FormLabel className="text-sm font-medium">
                                        Upload File <span className="text-red-500 ml-1">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                field.onChange(e.target.files ? e.target.files[0] : null);
                                                form.trigger('importFile');
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={isUploading || !form.watch('importFile')}
                            variant={isUploading ? 'secondary' : 'default'}
                        >
                                                    {
                                                        isUploading ? 'Uploading...' : 'Import Data'
                                                    }
                                                    </Button>
                                                    {error && (
                                                        <p className="text-sm text-destructive mt-2">{error.message || 'An error occurred during import'}</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </form>
                                    </Form>
    );
}