import type { z } from 'zod';
import type { FieldConfig } from './field-config';
import type { WizardConfig } from './wizard-config';

export interface FieldLink<TEntity extends object> {
  /** The source field that triggers the link */
  sourceField: keyof TEntity;
  /** The target field that gets updated */
  targetField: keyof TEntity;
  /** Transform function to convert source value to target value */
  transform: (sourceValue: any) => any;
  /** Only apply link if target field is empty (default: true) */
  onlyIfEmpty?: boolean;
}

export interface FormConfig<TEntity extends object> {
  mode: FormMode;
  wizard?: WizardConfig<TEntity>;
  fields: Array<FieldConfig<TEntity>>;
  validationSchema: z.ZodType<Partial<TEntity>>;
  layout?: FormLayout;
  /** When true, all fields are rendered as read-only and submit is disabled. */
  readOnly?: boolean;
  /** Toggle for showing the submit/next button. Defaults to true. */
  showSubmitButton?: boolean;
  /** Toggle for showing the back button (wizard/back). Defaults to true. */
  showBackButton?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  successMessage?: string;
  onSuccess?: (data: TEntity) => void | Promise<void>;
  onError?: (error: Error) => void;
  defaultValues?: Partial<TEntity>;
  /** Field linking configuration for auto-populating related fields */
  fieldLinks?: Array<FieldLink<TEntity>>;
}

export type FormMode = 'create' | 'edit' | 'wizard';

export type FormLayout = 'single-column' | 'two-column' | 'custom';
