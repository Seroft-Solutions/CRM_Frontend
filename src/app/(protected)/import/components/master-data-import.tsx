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
import { useForm } from 'react-hook-form';
import { useImportMasterDataFromFile } from '@/core/api/generated/spring/endpoints/master-data-import-controller/master-data-import-controller.gen';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { masterDataImportConfig } from '../constants';

interface MasterDataImportProps {}

export function MasterDataImport({}: MasterDataImportProps) {
  const form = useForm({
    defaultValues: {
      importFile: null,
    },
  });
  const router = useRouter();

  const {
    mutate: importMasterData,
    isPending: isUploading,
    error,
  } = useImportMasterDataFromFile({
    mutation: {
      onSuccess: (data) => {
        sessionStorage.setItem('masterImportResponse', JSON.stringify(data));
        router.push('/import/results');
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

  const handleDownloadTemplate = () => {
    const wsData = [
      masterDataImportConfig.columns.map((c) => c.header),
      masterDataImportConfig.columns.map((c) => c.example),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Data');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = masterDataImportConfig.filename;
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
            <h4 className="font-semibold mb-2">Master Data Import Instructions</h4>
            <div className="space-y-4">
              {/* Instructions List */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Instructions:</h5>
                <ul className="list-disc pl-5 text-sm text-foreground">
                  {masterDataImportConfig.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
              {/* Filename */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">
                  Template Filename:
                </h5>
                <p className="text-sm text-foreground">{masterDataImportConfig.filename}</p>
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
                      {masterDataImportConfig.columns.map((column, index) => (
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
                      accept=".xlsx,.xls,.csv"
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
