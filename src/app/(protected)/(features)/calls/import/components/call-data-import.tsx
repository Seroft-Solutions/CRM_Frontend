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
import {useImportCallsFromExcel} from "@/core/api/generated/spring";

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

    // State for dialog
    const [isOpen, setIsOpen] = useState(false);
    const [responseData, setResponseData] = useState<ImportResponse | null>(null);

    // Use the mutation hook from the generated file
    const { mutate: importCalls, isPending: isUploading, error } = useImportCallsFromExcel({
        mutation: {
            onSuccess: (data) => {
                console.log('Import successful:', data);
                setResponseData(data);
                setIsOpen(true);
                // Optional: Show success toast or reset form
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

    const handleDownloadErrorReport = () => {
        if (responseData?.errorReportCsv) {
            const blob = new Blob([responseData.errorReportCsv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'error-report.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleDownloadSkippedReport = () => {
        if (responseData?.skippedReportCsv) {
            const blob = new Blob([responseData.skippedReportCsv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'skipped-report.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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
                            {isUploading ? 'Uploading...' : 'Import Data'}
                        </Button>
                        {error && (
                            <p className="text-sm text-destructive mt-2">{error.message || 'An error occurred during import'}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Import Results Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col"> {/* Wider dialog, taller max-height, flex for internal scrolling */}
                        <DialogHeader className="flex-shrink-0"> {/* Prevent header from shrinking */}
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Import Results
                            </DialogTitle>
                            <DialogDescription>
                                Your import has been processed. Here's a summary:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto py-4 space-y-4"> {/* Main content scrolls, takes remaining space */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Total Rows Processed</span>
                                    <span className="font-semibold">{responseData?.totalRows || 0}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">✅ Successful Rows</span>
                                    <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                                        {responseData?.successfulRows || 0}
                                    </Badge>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">⚠️ Skipped Rows (Existing or Duplicate)</span>
                                    <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800">
                                        {responseData?.skippedRows || 0}
                                    </Badge>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">❌ Failed Rows (Missing master data)</span>
                                    <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800">
                                        {responseData?.failedRows || 0}
                                    </Badge>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm text-muted-foreground mb-2">Summary:</p>
                                <p className="text-sm">{responseData?.message}</p>
                            </div>
                            {responseData?.skippedErrors && responseData.skippedErrors.length > 0 && (
                                <div className="border rounded-md p-3 bg-yellow-50 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        <p className="text-sm font-medium text-yellow-800">Skipped Errors:</p>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <div className="h-64 overflow-y-auto border border-yellow-200 rounded-md bg-yellow-50 p-2 text-sm">
                                            <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                                                {responseData.skippedErrors.map((err, index) => (
                                                    <li key={index}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {responseData?.failedErrors && responseData.failedErrors.length > 0 && (
                                <div className="border rounded-md p-3 bg-red-50 flex flex-col"> {/* Flex for error section */}
                                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <p className="text-sm font-medium text-red-800">Field Errors:</p>
                                    </div>
                                    <div className="flex-1 min-h-0"> {/* Allow this to take space and scroll */}
                                        <div className="h-64 overflow-y-auto border border-red-200 rounded-md bg-red-50 p-2 text-sm"> {/* Increased height to 16rem (256px) */}
                                            <ul className="list-disc pl-5 text-red-700 space-y-1">
                                                {responseData.failedErrors.map((err, index) => (
                                                    <li key={index}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex-shrink-0 mt-auto"> {/* Footer sticks to bottom */}
                            {responseData?.skippedRows > 0 && responseData.skippedReportCsv && (
                                <Button onClick={handleDownloadSkippedReport} variant="outline" className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Download Skipped Report (.CSV)
                                </Button>
                            )}
                            {responseData?.failedRows > 0 && responseData.errorReportCsv && (
                                <Button onClick={handleDownloadErrorReport} variant="outline" className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Download Error Report (.CSV)
                                </Button>
                            )}
                            <Button onClick={() => setIsOpen(false)} variant="outline">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </Form>
    );
}