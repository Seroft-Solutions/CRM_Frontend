'use client';

import type { EntityTableProps } from '../types/entity-table';
import { EntityTable as InternalEntityTable } from '../../components/tables/EntityTable';

export function EntityTable<TEntity extends object>(props: EntityTableProps<TEntity>) {
  return <InternalEntityTable {...props} />;
}
