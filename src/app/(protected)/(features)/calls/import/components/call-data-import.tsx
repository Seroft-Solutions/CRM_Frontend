'use client';

import React, { useState } from 'react';
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
import { useDownloadImportTemplate, useImportCallsFromExcel } from '@/core/api/generated/spring';
import { callImportConfig } from '../config';
import { useQueryClient } from '@tanstack/react-query';
import { ImportProgress } from './import-progress';

interface CallDataImportProps {}

type RowStatus =
  | 'SUCCESS'
  | 'DUPLICATE'
  | 'VALIDATION_FAILED'
  | 'MASTER_DATA_MISSING'
  | 'SYSTEM_ERROR';

interface ImportSummary {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  validationErrorCount: number;
  masterMissingCount: number;
  systemErrorCount: number;
}

interface RowResult {
  rowNumber: number;
  data: string[];
  status: RowStatus;
  message: string;
}

interface ImportResponse {
  success: boolean;
  summary: ImportSummary;
  rows: RowResult[];
  message: string;
}

export function CallDataImport({}: CallDataImportProps) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      importFile: null,
    },
  });
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: importCalls,
    isPending: isUploading,
    error,
  } = useImportCallsFromExcel({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Import started:', data);

        // The response now contains { jobId, message }
        if (data?.jobId) {
          setCurrentJobId(data.jobId);
          // Don't navigate yet - progress component will handle it
        } else {
          console.error('No jobId in response:', data);
          alert('Import started but no job ID received');
        }
      },
      onError: (err) => {
        console.error('Import failed:', err);
        alert('Import failed: ' + (err?.message || 'Unknown error'));
      },
    },
  });

  const {
    refetch: fetchTemplate,
    isFetching: isDownloadingTemplate,
  } = useDownloadImportTemplate({
    query: {
      enabled: false,
    },
    request: {
      responseType: 'blob',
    },
  });

  const handleSubmit = (data: any) => {
    if (!data.importFile) {
      alert('Please select a file');
      return;
    }

    importCalls({ data: { file: data.importFile } });
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await fetchTemplate();
      if (!result.data) {
        throw result.error ?? new Error('Unable to download template');
      }

      // Ensure data is a Blob
      let blob: Blob;
      if (result.data instanceof Blob) {
        blob = result.data;
      } else {
        // Convert to Blob if it's not already
        blob = new Blob([result.data as any], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = callImportConfig.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Failed to download template', downloadError);
      alert('Unable to download template. Please try again.');
    }
  };

  const handleProgressComplete = () => {
    // Invalidate import history queries when progress completes
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === '/api/import-histories',
    });
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === '/api/_search/import-histories',
    });
    form.reset();
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
                  {callImportConfig.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
              {/* Filename */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">
                  Template Filename:
                </h5>
                <p className="text-sm text-foreground">{callImportConfig.filename}</p>
                {/* Download Template Button */}
                <div className="mt-3">
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="flex items-center gap-2"
                    type="button"
                    disabled={isDownloadingTemplate}
                  >
                    <Download className="h-4 w-4" />
                    {isDownloadingTemplate ? 'Downloading…' : 'Download Template (.xlsx)'}
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
                      {callImportConfig.columns.map((column, index) => (
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
              disabled={isUploading || !form.watch('importFile') || currentJobId !== null}
              variant={isUploading || currentJobId !== null ? 'secondary' : 'default'}
            >
              {currentJobId ? 'Import in Progress...' : isUploading ? 'Uploading...' : 'Import Data'}
            </Button>
            {error && (
              <p className="text-sm text-destructive mt-2">
                {error.message || 'An error occurred during import'}
              </p>
            )}
          </CardContent>
        </Card>
        {/* Show progress when we have a jobId */}
        {currentJobId && (
          <ImportProgress jobId={currentJobId} onComplete={handleProgressComplete} />
        )}
      </form>
    </Form>
  );
}
