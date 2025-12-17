'use client';

import type { FormConfig } from '../config/form/form-config';
import { FormWizard as InternalFormWizard } from '../../components/forms/FormWizard';

export interface FormWizardProps<TEntity extends object> {
  config: FormConfig<TEntity>;
  onCancel?: () => void;
}

export function FormWizard<TEntity extends object>(props: FormWizardProps<TEntity>) {
  return <InternalFormWizard {...props} />;
}
