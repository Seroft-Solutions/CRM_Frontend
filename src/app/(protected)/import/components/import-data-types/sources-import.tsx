// ===============================================================
// 🛑 AUTO-GENERATED INSPIRED FILE – CUSTOMIZATION ALLOWED 🛑
// - Purpose: Display import instructions for source data and a file input field
// - To customize: Edit directly or use feature-level extensions
// ===============================================================

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';

interface SourceImportProps {
  // Add props if needed, e.g., for handling file submission
}

const importConfig = {
  instructions: [
    "Fill in the data starting from row 2 (row 1 contains headers)",
    "Name column is required and must be 2-50 characters",
    "Status can be: ACTIVE, INACTIVE (if empty, defaults to ACTIVE)",
    "Empty rows will be skipped",
    "Save the file as .xlsx or .xls format",
  ],
  filename: "source_import_template.xlsx",
  columns: [
    {
      header: "Name",
      column: "A",
      example: "Website",
      description: "Source name (Required, 2-50 characters)",
    },
    {
      header: "Description",
      column: "B",
      example: "Leads generated from the company website",
      description: "Source description (Optional, max 255 characters)",
    },
    {
      header: "Remark",
      column: "C",
      example: "Track referral URLs for analytics",
      description: "Additional remarks (Optional, max 1000 characters)",
    },
    {
      header: "Status",
      column: "D",
      example: "ACTIVE",
      description: "Status (Optional, defaults to ACTIVE)",
    },
  ],
};

export function SourceImport({}: SourceImportProps) {
  const form = useForm({
    defaultValues: {
      importFile: null,
    },
  });

  const handleSubmit = (data: any) => {
    console.log('File Selected:', data.importFile);
    // Add logic to handle file upload, e.g., send to an API
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
              <h4 className="font-semibold mb-2">Source Import Instructions</h4>
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
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
