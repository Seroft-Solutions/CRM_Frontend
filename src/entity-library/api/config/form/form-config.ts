import type { z } from 'zod';
import type { FieldConfig } from './field-config';
import type { WizardConfig } from './wizard-config';

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
