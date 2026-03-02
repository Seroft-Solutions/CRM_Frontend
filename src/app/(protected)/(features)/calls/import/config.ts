export const callImportConfig = {
  instructions: [
    'Fill in the data starting from row 2 (row 1 contains headers)',
    'Maximum 500 data rows per upload',
    'If a Customer or Product does not exist, it will be automatically created.',
    'For new customers, Zip Code is required and must be a valid 6-digit area pincode in the system.',
    'Zip Code validation: Must be exactly 6 digits and match an active area in the system.',
    'All other fields are required except External ID, Customer phone number, Barcode Text, Sub Call Type, and Remark which are optional. Required fields must match existing master data exactly (no new masters created during import)',
    'Remark field is optional and can contain additional notes about the call (maximum 2000 characters)',
    'Partial import: Only valid rows are added; invalid rows are failed, duplicates are skipped',
    'Failed rows can be edited inline and saved individually after validation',
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
      description: 'Zip code (Required for new customers) - Must be exactly 6 digits and exist as a valid area pincode',
      example: '110001',
    },
    {
      column: 'E',
      header: 'Product Name',
      description: 'Product name (Required) - If the product does not exist, it will be created.',
      example: 'Software XYZ',
    },
    {
      column: 'F',
      header: 'Barcode Text',
      description:
        'Barcode Text (Optional) - Stored when a new product is created via the import.',
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
    {
      column: 'K',
      header: 'Remark',
      description: 'Remark or notes (Optional) - Additional information about the call. Maximum 2000 characters.',
      example: 'Customer requested callback after 2 PM',
    },
  ],
};
