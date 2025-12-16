import { z } from 'zod';

export const paginationConfigSchema = z.object({
  defaultPageSize: z.number().int().positive(),
  pageSizeOptions: z.array(z.number().int().positive()).min(1),
  showTotalCount: z.boolean().optional(),
  showPageSizeSelector: z.boolean().optional(),
  strategy: z.enum(['offset', 'cursor']).optional(),
});

export const tableColumnSchema = z.object({
  field: z.string().min(1),
  header: z.string().min(1),
  type: z
    .enum([
      'text',
      'number',
      'date',
      'datetime',
      'boolean',
      'relationship',
      'badge',
      'image',
      'custom',
    ])
    .optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  width: z.string().min(1).optional(),
  minWidth: z.string().min(1).optional(),
  maxWidth: z.string().min(1).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  truncate: z.boolean().optional(),
  showTooltip: z.boolean().optional(),
  render: z.unknown().optional(),
  relationshipConfig: z.unknown().optional(),
  format: z.unknown().optional(),
});

export const tableConfigSchema = z.object({
  columns: z.array(tableColumnSchema).min(1),
  defaultSort: z
    .object({
      field: z.string().min(1),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  pagination: paginationConfigSchema,
  rowActions: z.array(z.unknown()).optional(),
  bulkActions: z.array(z.unknown()).optional(),
  columnVisibility: z.unknown().optional(),
  rowSelection: z.unknown().optional(),
  emptyState: z.unknown().optional(),
});

export const entityFeatureFlagsSchema = z.object({
  enableExport: z.boolean().optional(),
  enableImport: z.boolean().optional(),
  enableBulkActions: z.boolean().optional(),
  enableAdvancedFilters: z.boolean().optional(),
  enableColumnVisibility: z.boolean().optional(),
  enableUserPreferences: z.boolean().optional(),
});

export const entityConfigSchema = z.object({
  entityName: z.string().min(1),
  displayName: z.string().min(1),
  displayNamePlural: z.string().min(1),
  generatedDtoType: z.unknown(),
  apiBasePath: z.string().min(1),
  table: tableConfigSchema,
  form: z.unknown().optional(),
  relationships: z.array(z.unknown()).optional(),
  search: z
    .object({
      globalSearchFields: z.array(z.string().min(1)).min(1),
      debounceMs: z.number().int().positive().optional(),
      minCharacters: z.number().int().min(0).optional(),
      highlightMatches: z.boolean().optional(),
      persistInUrl: z.boolean().optional(),
      searchPlaceholder: z.string().optional(),
      showSearchStats: z.boolean().optional(),
      showClearFilters: z.boolean().optional(),
    })
    .optional(),
  features: entityFeatureFlagsSchema.optional(),
});
