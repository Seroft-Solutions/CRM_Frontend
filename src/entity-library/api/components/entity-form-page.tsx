'use client';

import type { EntityFormPageConfig } from '../config/entity/entity-form-page-config';
import { EntityFormPage as InternalEntityFormPage } from '../../components/EntityFormPage';

export interface EntityFormPageProps<TEntity extends object> {
  config: EntityFormPageConfig<TEntity>;
  id?: number;
}

export function EntityFormPage<TEntity extends object>(props: EntityFormPageProps<TEntity>) {
  return <InternalEntityFormPage {...props} />;
}
