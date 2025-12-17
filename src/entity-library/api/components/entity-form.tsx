'use client';

import type { FormConfig } from '../config/form/form-config';
import { EntityForm as InternalEntityForm } from '../../components/forms/EntityForm';

export interface EntityFormProps<TEntity extends object> {
  config: FormConfig<TEntity>;
  onCancel?: () => void;
}

export function EntityForm<TEntity extends object>(props: EntityFormProps<TEntity>) {
  return <InternalEntityForm {...props} />;
}
