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
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useImportMasterDataFromFile } from '@/core/api/generated/spring/endpoints/import-master-data-controller/import-master-data-controller.gen';

interface MasterDataImportProps {}

interface ImportResponse {
  success: boolean;
  successCount: number;
  skippedCount: number;
  totalRows: number;
  message: string;
  errorCount: number;
  errors: string[];
}

const importConfig = {
  instructions: [
    'Fill in the data starting from row 2 (row 1 contains headers)',
    'Each column represents a different master data type; provide names only',
    'Other fields (e.g., description, status) will default to standard values',
    'Maximum 500 data rows (excluding header)',
    'Empty cells or rows will be skipped',
    'Duplicate names (already existing) will be skipped',
    'Save the file as .xlsx, .xls, or .csv format',
  ],
  filename: 'master_data_import_template.xlsx',
  columns: [
    {
      header: 'Call Type',
      column: 'A',
      example: 'Customer Support',
      description: 'Call Type name (2-50 characters)',
    },
    {
      header: 'Sub Call Type',
      column: 'B',
      example: 'Technical Issue',
      description: 'Sub Call Type name (2-50 characters)',
    },
    {
      header: 'Call Status',
      column: 'C',
      example: 'Open',
      description: 'Call Status name (2-50 characters)',
    },
    {
      header: 'Priority',
      column: 'D',
      example: 'High',
      description: 'Priority name (2-50 characters)',
    },
    {
      header: 'Source',
      column: 'E',
      example: 'Email',
      description: 'Source name (2-50 characters)',
    },
  ],
};

export function MasterDataImport({}: MasterDataImportProps) {
  const form = useForm({
    defaultValues: {
      importFile: null,
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const [responseData, setResponseData] = useState<ImportResponse | null>(null);

  const {
    mutate: importMasterData,
    isPending: isUploading,
    error,
  } = useImportMasterDataFromFile({
    mutation: {
      onSuccess: (data) => {
        console.log('Import successful:', data);
        setResponseData(data);
        setIsOpen(true);

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

    importMasterData({ data: { file: data.importFile } });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-semibold mb-2">Master Data Import Instructions</h4>
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
                      accept=".xlsx,.xls,.csv"
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

        {/* Import Results Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Results
              </DialogTitle>
              <DialogDescription>
                Your import has been processed. Here's a summary:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Total Rows Processed</span>
                  <span className="font-semibold">{responseData?.totalRows || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Successfully Imported</span>
                  <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                    {responseData?.successCount || 0}
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Skipped (Duplicates)</span>
                  <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800">
                    {responseData?.skippedCount || 0}
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Failed</span>
                  <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800">
                    {responseData?.errorCount || 0}
                  </Badge>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Summary:</p>
                <p className="text-sm">{responseData?.message}</p>
              </div>
              {responseData?.errors && responseData.errors.length > 0 && (
                <div className="border rounded-md p-3 bg-red-50">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                    {responseData.errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
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
