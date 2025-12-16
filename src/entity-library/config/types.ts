import type { ComponentType, ReactNode } from 'react';
import type { z } from 'zod';

export interface LegacyEntityConfig<TEntity extends object> {
  entityName: string;
  displayName: string;
  displayNamePlural: string;
  generatedDtoType: TEntity;
  apiBasePath: string;
  table: TableConfig<TEntity>;
  form?: FormConfig<TEntity>;
  relationships?: Array<RelationshipConfig<TEntity>>;
  search?: SearchConfig<TEntity>;
  features?: EntityFeatureFlags;
}

export interface EntityFeatureFlags {
  enableExport?: boolean;
  enableImport?: boolean;
  enableBulkActions?: boolean;
  enableAdvancedFilters?: boolean;
  enableColumnVisibility?: boolean;
  enableUserPreferences?: boolean;
}

export interface TableConfig<TEntity extends object> {
  columns: Array<ColumnConfig<TEntity>>;
  defaultSort?: SortConfig<TEntity>;
  pagination: PaginationConfig;
  rowActions?: Array<RowActionConfig<TEntity>>;
  bulkActions?: Array<BulkActionConfig<TEntity>>;
  columnVisibility?: ColumnVisibilityConfig<TEntity>;
  rowSelection?: RowSelectionConfig;
  emptyState?: EmptyStateConfig;
}

export interface ColumnConfig<TEntity extends object> {
  field: keyof TEntity;
  header: string;
  type?: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  showTooltip?: boolean;
  render?: (value: TEntity[keyof TEntity], row: TEntity) => ReactNode;
  relationshipConfig?: RelationshipCellConfig;
  format?: FormatConfig;
}

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'relationship'
  | 'badge'
  | 'image'
  | 'custom';

export interface RelationshipCellConfig {
  targetEntity: string;
  displayField: string;
  linkTo?: string;
  showCount?: boolean;
}

export interface FormatConfig {
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}

export interface SortConfig<TEntity extends object> {
  field: keyof TEntity;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  showTotalCount?: boolean;
  showPageSizeSelector?: boolean;
  strategy?: 'offset' | 'cursor';
}

export interface RowActionConfig<TEntity extends object> {
  id: string;
  label: string;
  onClick?: (row: TEntity) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string | ((row: TEntity) => string);
  variant?: 'default' | 'destructive';
}

export interface BulkActionConfig<TEntity extends object> {
  id: string;
  label: string;
  onClick?: (rows: TEntity[]) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string | ((count: number) => string);
  variant?: 'default' | 'destructive';
}

export interface ColumnVisibilityConfig<TEntity extends object> {
  defaultHidden?: Array<keyof TEntity>;
  storageKey?: string;
  userConfigurable?: boolean;
}

export interface RowSelectionConfig {
  enabled?: boolean;
}

export interface EmptyStateConfig {
  title?: string;
  description?: string;
}

export interface FormConfig<TEntity extends object> {
  mode: FormMode;
  wizard?: WizardConfig<TEntity>;
  fields: Array<FieldConfig<TEntity>>;
  validationSchema: z.ZodType<Partial<TEntity>>;
  layout?: FormLayout;
  submitButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  successMessage?: string;
  onSuccess?: (data: TEntity) => void | Promise<void>;
  onError?: (error: Error) => void;
  defaultValues?: Partial<TEntity>;
}

export type FormMode = 'create' | 'edit' | 'wizard';

export type FormLayout = 'single-column' | 'two-column' | 'custom';

export interface WizardConfig<TEntity extends object> {
  steps: Array<WizardStepConfig<TEntity>>;
  allowBackwardNavigation?: boolean;
  showProgressIndicator?: boolean;
  progressIndicatorStyle?: 'steps' | 'bar' | 'dots';
  saveProgressOnStep?: boolean;
  onStepComplete?: (stepId: string, data: Partial<TEntity>) => void | Promise<void>;
  enableReviewStep?: boolean;
  allowEditFromReview?: boolean;
}

export interface WizardStepConfig<TEntity extends object> {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  fields: Array<keyof TEntity>;
  validationSchema: z.ZodType<Partial<TEntity>>;
  condition?: (formData: Partial<TEntity>) => boolean;
}

export interface FieldConfig<TEntity extends object> {
  field: keyof TEntity;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  condition?: (formData: Partial<TEntity>) => boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  relationshipConfig?: unknown;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'relationship'
  | 'file'
  | 'custom';

export interface RelationshipConfig<TEntity extends object> {
  id: string;
  label: string;
  sourceField?: keyof TEntity;
  targetEntity?: string;
}

export interface SearchConfig<TEntity extends object> {
  globalSearchFields: Array<keyof TEntity>;
  debounceMs?: number;
  minCharacters?: number;
  highlightMatches?: boolean;
  persistInUrl?: boolean;
  searchPlaceholder?: string;
  showSearchStats?: boolean;
  showClearFilters?: boolean;
}

export type ExtractEntity<T> = T extends LegacyEntityConfig<infer E> ? E : never;
