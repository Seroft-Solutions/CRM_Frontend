'use client';

import type { EmptyStateConfig } from '@/entity-library/config';

export function TableEmpty({ emptyState }: { emptyState?: EmptyStateConfig }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      <div className="text-base font-semibold text-foreground">
        {emptyState?.title ?? 'No results'}
      </div>
      {emptyState?.description ? <div className="mt-1">{emptyState.description}</div> : null}
    </div>
  );
}
