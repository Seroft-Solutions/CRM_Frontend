'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useImportCallsFromExcel } from '@/core/api/generated/spring';
import * as XLSX from 'xlsx';

interface CallDataImportProps {}

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
    'Fill in the data starting from row 2 (row 1 contains headers)',
    'Maximum 500 data rows per upload',
    'If a Customer or Product does not exist, it will be automatically created.',
    'For new customers, Zip Code is required to determine the area.',
    'All other fields are required except External ID and Sub Call Type which are optional. Required fields must match existing master data exactly (no new masters created during import)',
    'Partial import: Only valid rows are added; invalid rows are failed, duplicates are skipped',
    'Download error report CSV from response for failed rows details',
    'Save the file as .xlsx or .xls format',
  ],
  filename: 'call_import_template.xlsx',
  columns: [
    {
      column: 'A',
      header: 'External ID',
      description: 'External ID (Optional) - Unique identifier. If empty, a UUID will be generated',
      example: '81d9fe86-22d4-4b1b-9a26-f837d364b6d4',
    },
    {
      column: 'B',
      header: 'Customer name',
      description: 'Customer business name (Required) - If the customer does not exist, it will be created.',
      example: 'ABC Enterprises',
    },
    {
      column: 'C',
      header: 'Zip code',
      description: 'Zip code (Required for new customers)',
      example: '12345',
    },
    {
      column: 'D',
      header: 'Product Name',
      description: 'Product name (Required) - If the product does not exist, it will be created.',
      example: 'Software XYZ',
    },
    {
      column: 'E',
      header: 'Call Type',
      description: 'CallType name (Required) - must match existing CallType exactly',
      example: 'Customer Support',
    },
    {
      column: 'F',
      header: 'Sub Call Type',
      description:
        'SubCallType name (Optional) - must match existing SubCallType and belong to the CallType if provided',
      example: 'Technical Support',
    },
    {
      column: 'G',
      header: 'Priority',
      description: 'Priority name (Required) - must match existing Priority exactly',
      example: 'High',
    },
    {
      column: 'H',
      header: 'Call Status',
      description: 'CallStatus name (Required) - must match existing CallStatus exactly',
      example: 'Open',
    },
  ],
};

export function CallDataImport({}: CallDataImportProps) {
  const form = useForm({
    defaultValues: {
      importFile: null,
    },
  });
  const router = useRouter();

  const {
    mutate: importCalls,
    isPending: isUploading,
    error,
  } = useImportCallsFromExcel({
    mutation: {
      onSuccess: (data) => {
        console.log('Import successful:', data);

        sessionStorage.setItem('importResponse', JSON.stringify(data));

        router.push('/calls/import/results');
        form.reset();
      },
      onError: (err) => {
        console.error('Import failed:', err);
        alert('Import failed: ' + (err?.message || 'Unknown error'));
      },
    },
  });

  const handleSubmit = (data: any) => {
    if (!data.importFile) {
      alert('Please select a file');
      return;
    }

    importCalls({ data: { file: data.importFile } });
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      [
        'External ID',
        'Customer name',
        'Zip code',
        'Product Name',
        'Call Type',
        'Sub Call Type',
        'Priority',
        'Call Status',
      ],
      [
        '81d9fe86-22d4-4b1b-9a26-f837d364b6d4',
        'ABC Enterprises',
        '12345',
        'Software XYZ',
        'Customer Support',
        'Technical Support',
        'High',
        'Open',
      ],
      [
        'EXT-123',
        'Wood Business',
        '67890',
        'iPhone 15 Pro',
        'Billing Inquiry',
        '',
        'Medium',
        'In Progress',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calls');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
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
                <h5 className="text-sm font-medium text-muted-foreground mb-2">
                  Template Filename:
                </h5>
                <p className="text-sm text-foreground">{importConfig.filename}</p>
                {/* Download Template Button */}
                <div className="mt-3">
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="flex items-center gap-2"
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    Download Template (.xlsx)
                  </Button>
                </div>
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
                <FormItem className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg">
                  <FormLabel className="text-sm font-medium text-blue-800">
                    Upload File <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      className="border-blue-300 bg-white"
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
              <p className="text-sm text-destructive mt-2">
                {error.message || 'An error occurred during import'}
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
