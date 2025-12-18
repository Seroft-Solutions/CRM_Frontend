export interface FieldConfig<TEntity extends object> {
  field: keyof TEntity;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  /** Optional field grouping label (used by `EntityForm`/`FormWizard`). */
  section?: string;
  /** Layout hint for grid-based layouts. */
  colSpan?: 1 | 2;
  condition?: (formData: Partial<TEntity>) => boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  relationshipConfig?: RelationshipFieldConfig;
}

export interface RelationshipFieldConfig {
  /** Hook for fetching relationship options (array or Spring Page-like `{ content }`). */
  useGetAll: (params: Record<string, unknown>) => {
    data?: { content?: unknown[] } | unknown[];
    isLoading: boolean;
  };
  /** Params passed to `useGetAll` (e.g., `{ page: 0, size: 1000 }`). */
  params?: Record<string, unknown>;
  /** Extract stable id/key from an option. */
  getOptionId: (option: unknown) => string | number;
  /** Extract display label from an option. */
  getOptionLabel: (option: unknown) => string;
  /** Convert option into the value stored in form state (defaults to the option itself). */
  toValue?: (option: unknown) => unknown;
  /** Convert current form value into the option id (defaults to reading `value.id` or the value itself). */
  getValueId?: (value: unknown) => string | number | undefined;
  /** Placeholder text override. */
  placeholder?: string;
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
