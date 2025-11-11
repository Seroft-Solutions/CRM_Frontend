export const callImportConfig = {
  instructions: [
    'Fill in the data starting from row 2 (row 1 contains headers)',
    'Maximum 500 data rows per upload',
    'If a Customer or Product does not exist, it will be automatically created.',
    'For new customers, Zip Code is required to determine the area.',
    'All other fields are required except External ID, Customer phone number, Product Code, and Sub Call Type which are optional. Required fields must match existing master data exactly (no new masters created during import)',
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
      description:
        'Customer business name (Required) - If the customer does not exist, it will be created.',
      example: 'ABC Enterprises',
    },
    {
      column: 'C',
      header: 'Customer phone number',
      description:
        'Customer phone number (Optional) - Captured when creating a new customer during import. Include country code if needed.',
      example: '+15551234567',
    },
    {
      column: 'D',
      header: 'Zip code',
      description: 'Zip code (Required for new customers)',
      example: '12345',
    },
    {
      column: 'E',
      header: 'Product Name',
      description: 'Product name (Required) - If the product does not exist, it will be created.',
      example: 'Software XYZ',
    },
    {
      column: 'F',
      header: 'Product Code',
      description:
        'Product code (Optional) - Stored when a new product is created via the import.',
      example: 'PRD-001',
    },
    {
      column: 'G',
      header: 'Call Type',
      description: 'CallType name (Required) - must match existing CallType exactly',
      example: 'Customer Support',
    },
    {
      column: 'H',
      header: 'Sub Call Type',
      description:
        'SubCallType name (Optional) - must match existing SubCallType and belong to the CallType if provided',
      example: 'Technical Support',
    },
    {
      column: 'I',
      header: 'Priority',
      description: 'Priority name (Required) - must match existing Priority exactly',
      example: 'High',
    },
    {
      column: 'J',
      header: 'Call Status',
      description: 'CallStatus name (Required) - must match existing CallStatus exactly',
      example: 'Open',
    },
  ],
};
