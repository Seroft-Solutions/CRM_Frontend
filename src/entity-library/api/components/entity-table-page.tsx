'use client';

import type { EntityTablePageConfig, StatusEnum } from '../config/entity/entity-table-page-config';
import { EntityTablePage as InternalEntityTablePage } from '../../components/EntityTablePage';

export interface EntityTablePageProps<TEntity extends object, TStatus extends StatusEnum> {
  config: EntityTablePageConfig<TEntity, TStatus>;
}

export function EntityTablePage<TEntity extends object, TStatus extends StatusEnum>(
  props: EntityTablePageProps<TEntity, TStatus>
) {
  return <InternalEntityTablePage {...props} />;
}
