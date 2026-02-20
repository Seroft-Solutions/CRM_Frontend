'use client';

import type { ReactNode } from 'react';
import type { ColumnConfig } from '@/entity-library/config';
import { TableColumnVisibility } from './TableColumnVisibility';
import { cn } from '@/lib/utils';

export function EntityTableToolbar<TEntity extends object>({
  toolbar,
  externalActions,
  columns,
  hidden,
  onToggle,
  showColumnMenu,
  theme = 'default',
}: {
  toolbar?: ReactNode;
  externalActions?: ReactNode;
  columns: Array<ColumnConfig<TEntity>>;
  hidden: Record<string, boolean>;
  onToggle: (field: keyof TEntity) => void;
  showColumnMenu: boolean;
  theme?: 'default' | 'sidebar';
}) {
  const wrapperClass =
    theme === 'sidebar'
      ? 'w-full rounded-lg border border-white/10 bg-[var(--sidebar)] px-3 py-2 text-[color:var(--sidebar-foreground)] shadow-sm'
      : 'w-full';

  const actionButtonClass =
    theme === 'sidebar'
      ? 'border-[color:var(--sidebar-accent)] bg-transparent text-[color:var(--sidebar-accent)] hover:bg-[color:var(--sidebar-accent)] hover:text-[color:var(--sidebar-accent-foreground)]'
      : undefined;

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', wrapperClass)}>
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
        {externalActions}
        {showColumnMenu ? (
          <TableColumnVisibility
            columns={columns}
            hidden={hidden}
            onToggle={onToggle}
            buttonClassName={actionButtonClass}
          />
        ) : null}
      </div>
    </div>
  );
}
