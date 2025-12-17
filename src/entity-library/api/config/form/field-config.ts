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
