export const customerImportConfig = {
  instructions: [
    'Fill in the data starting from row 2 (row 1 contains headers)',
    'Maximum 500 data rows per upload',
    'Mobile number must be unique - duplicates will be skipped',
    'Customer Business Name and Mobile are required',
    'Email and Contact Person are optional',
    'Zip Code is optional',
    'Save the file as .xlsx or .xls format',
  ],
  filename: 'customer_import_template.xlsx',
  columns: [
    {
      column: 'A',
      header: 'Customer Business Name',
      description: 'Customer business name (Required, 2-100 characters)',
      example: 'ABC Enterprises',
    },
    {
      column: 'B',
      header: 'Mobile',
      description: 'Mobile number (Required, 10-15 digits, must be unique)',
      example: '+1234567890',
    },
    {
      column: 'C',
      header: 'Email',
      description: 'Email address (Optional)',
      example: 'contact@abc.com',
    },
    {
      column: 'D',
      header: 'Contact Person',
      description: 'Contact person name (Optional, 2-100 characters)',
      example: 'John Doe',
    },
    {
      column: 'E',
      header: 'Zip Code',
      description: 'Area zip code (Optional)',
      example: '12345',
    },
  ],
};
