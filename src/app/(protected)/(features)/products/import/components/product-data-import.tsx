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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ImportProgress } from './import-progress';
import {
  useImportProductsFromExcel,
  useGetImportTemplate3,
  useDownloadImportTemplate,
} from '@/core/api/generated/spring';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

export function ProductDataImport() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [selectedSystemConfigId, setSelectedSystemConfigId] = useState<number | null>(null);

  interface ImportFormValues {
    importFile: File | null;
  }

  interface ImportJobResponse {
    jobId?: string;
  }

  interface ImportTemplateInfo {
    columns?: Array<{
      header: string;
      column?: string;
      example?: string;
      description?: string;
    }>;
    filename?: string;
  }

  const form = useForm<ImportFormValues>({
    defaultValues: {
      importFile: null,
    },
  });

  const { data: systemConfigs = [] } = useGetAllSystemConfigs(
    { page: 0, size: 1000, 'status.equals': 'ACTIVE', 'systemConfigType.equals': 'PRODUCT' },
    { query: { staleTime: 5 * 60 * 1000 } }
  );

  const templateParams = selectedSystemConfigId
    ? { systemConfigId: selectedSystemConfigId }
    : undefined;

  // Fetch template info (only after selecting a System Config)
  const { data: templateInfoData } = useGetImportTemplate3(templateParams, {
    query: { enabled: !!selectedSystemConfigId },
  });
  const templateInfo = templateInfoData as ImportTemplateInfo | undefined;

  const {
    mutate: importProducts,
    isPending: isUploading,
    error: importError,
  } = useImportProductsFromExcel({
    mutation: {
      onSuccess: (data: unknown) => {
        const response = data as ImportJobResponse;

        if (response?.jobId) {
          setCurrentJobId(response.jobId);
        } else {
          console.error('No jobId in response:', data);
          toast.error('Import failed to start', {
            description: 'No job ID received from server.',
          });
        }
      },
      onError: (err: unknown) => {
        const errorResponse = err as {
          response?: { data?: { message?: string; title?: string } };
          message?: string;
        };

        console.error('Import failed:', err);

        // Provide user-friendly error messages
        let errorMessage = 'Import failed: ';

        if (errorResponse?.response?.data?.message) {
          errorMessage += errorResponse.response.data.message;
        } else if (errorResponse?.response?.data?.title) {
          errorMessage += errorResponse.response.data.title;
        } else if (errorResponse?.message) {
          errorMessage += errorResponse.message;
        } else {
          errorMessage += 'Unknown server error';
        }

        toast.error('Import failed', {
          description: errorMessage,
        });
      },
    },
  });

  const handleSubmit = (data: ImportFormValues) => {
    if (!data.importFile) {
      toast.error('Please select a file to import');

      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (data.importFile.size > maxSize) {
      toast.error('File size cannot exceed 10MB');

      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(data.importFile.type)) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');

      return;
    }

    if (templateInfo?.columns) {
      const headers = templateInfo.columns.map((column) => column.header);

      sessionStorage.setItem('productImportColumns', JSON.stringify(headers));
    }
    if (selectedSystemConfigId) {
      sessionStorage.setItem('productImportSystemConfigId', String(selectedSystemConfigId));
    }

    importProducts({
      data: {
        file: data.importFile,
      },
      params: templateParams,
    });
  };

  const { refetch: downloadTemplate, isFetching: isDownloadingTemplate } =
    useDownloadImportTemplate(templateParams, {
      query: {
        enabled: false,
      },
      request: {
        responseType: 'blob',
      },
    });

  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplate();

      if (!result.data) {
        throw result.error ?? new Error('Unable to download template');
      }

      // Ensure data is a Blob
      let blob: Blob;

      if (result.data instanceof Blob) {
        blob = result.data;
      } else {
        blob = new Blob([result.data as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = templateInfo?.filename || 'product_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Failed to download template', downloadError);
      toast.error('Unable to download template. Please try again.');
    }
  };

  const handleProgressComplete = () => {
    setCurrentJobId(null);
  };

  // If we have a jobId, show progress tracker
  if (currentJobId) {
    return <ImportProgress jobId={currentJobId} onComplete={handleProgressComplete} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {importError && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Import Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{importError?.message || 'An error occurred during import'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-semibold mb-2">Product Data Bulk Import Instructions</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">System Config:</h5>
                <Select
                  value={selectedSystemConfigId ? String(selectedSystemConfigId) : ''}
                  onValueChange={(value) => setSelectedSystemConfigId(value ? Number(value) : null)}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a System Config to generate the template" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfigs.map((config: { id: number; configKey: string }) => (
                      <SelectItem key={config.id} value={String(config.id)}>
                        {config.configKey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selecting a System Config will generate attribute columns in the template.
                </p>
              </div>

              {/* Instructions List */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Instructions:</h5>
                <ul className="list-disc pl-5 text-sm text-foreground">
                  <li>Fill in the data starting from row 2 (row 1 contains headers)</li>
                  <li>Product Name and Barcode Text columns are required</li>
                  <li>Barcode Text must contain only letters, numbers, underscores, or hyphens</li>
                  <li>Prices must be numbers between 0 and 999999</li>
                  <li>
                    Select a System Config and fill the attribute columns shown in the template
                  </li>
                  <li>
                    Variant Price and Variant Stock override base prices for specific variants
                  </li>
                  <li>For products without variants: use Total Quantity column</li>
                  <li>Each row represents either a base product or a product variant</li>
                  <li>Empty rows will be skipped</li>
                  <li>Save the file as .xlsx format</li>
                </ul>
              </div>

              {/* Template Download */}
              <div>
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">
                    Template Filename:
                  </h5>
                  <p className="text-sm text-foreground">
                    {templateInfo?.filename || 'product_import_template.xlsx'}
                  </p>

                  <div className="mt-3">
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="flex items-center gap-2"
                      type="button"
                      disabled={isDownloadingTemplate || !selectedSystemConfigId}
                    >
                      <Download className="h-4 w-4" />
                      {isDownloadingTemplate ? 'Downloading...' : 'Download Template (.xlsx)'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Columns Table */}
              {templateInfo?.columns && (
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
                        {templateInfo.columns.map((column, index: number) => (
                          <tr key={index} className="even:bg-muted/50">
                            <td className="border border-border p-2 text-sm">{column.column}</td>
                            <td className="border border-border p-2 text-sm">{column.header}</td>
                            <td className="border border-border p-2 text-sm">{column.example}</td>
                            <td className="border border-border p-2 text-sm">
                              {column.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* File Input Field */}
            <FormField
              control={form.control}
              name="importFile"
              render={({ field }) => (
                <FormItem className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg">
                  <FormLabel className="text-sm font-medium text-blue-800">
                    Upload Excel File{' '}
                    <span className="text-red-500 ml-1" aria-label="required">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      className="border-blue-300 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;

                        field.onChange(file);

                        // Show file info
                        if (file) {
                          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

                          console.log(`Selected file: ${file.name} (${fileSizeMB} MB)`);
                        }

                        form.trigger('importFile');
                      }}
                      disabled={isUploading}
                      aria-describedby="file-requirements"
                    />
                  </FormControl>
                  <div id="file-requirements" className="mt-2 text-xs text-blue-600">
                    <p>• Supported formats: .xlsx, .xls</p>
                    <p>• Maximum size: 10MB</p>
                    <p>• Maximum rows: 1000</p>
                  </div>
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
              size="lg"
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Starting Import...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import Products
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
