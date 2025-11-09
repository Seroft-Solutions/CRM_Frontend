export type MasterDataImportColumn = {
  header: string;
  column: string;
  example: string;
  description: string;
};

export const masterDataImportConfig = {
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
  ] as MasterDataImportColumn[],
};

