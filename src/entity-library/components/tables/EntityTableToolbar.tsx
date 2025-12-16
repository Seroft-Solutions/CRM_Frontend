'use client';

import type { ReactNode } from 'react';
import type { ColumnConfig } from '@/entity-library/config';
import { TableColumnVisibility } from './TableColumnVisibility';

export function EntityTableToolbar<TEntity extends object>({
  toolbar,
  externalActions,
  columns,
  hidden,
  onToggle,
  showColumnMenu,
}: {
  toolbar?: ReactNode;
  externalActions?: ReactNode;
  columns: Array<ColumnConfig<TEntity>>;
  hidden: Record<string, boolean>;
  onToggle: (field: keyof TEntity) => void;
  showColumnMenu: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
        {externalActions}
        {showColumnMenu ? (
          <TableColumnVisibility
            columns={columns}
            hidden={hidden}
            onToggle={onToggle}
          />
        ) : null}
      </div>
    </div>
  );
}
