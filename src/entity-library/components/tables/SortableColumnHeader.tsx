'use client';

import type { SortConfig } from '@/entity-library/config';
import { Button } from '@/components/ui/button';

export function SortableColumnHeader<TEntity extends object>({
  header,
  field,
  sort,
  onSortChange,
}: {
  header: string;
  field: keyof TEntity;
  sort?: SortConfig<TEntity>;
  onSortChange?: (sort?: SortConfig<TEntity>) => void;
}) {
  const isActive = sort?.field === field;
  const direction = isActive ? sort?.direction : undefined;

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-auto p-0 text-xs font-semibold hover:underline"
      onClick={() =>
        onSortChange?.({
          field,
          direction: isActive && direction === 'asc' ? 'desc' : 'asc',
        })
      }
    >
      {header}
      {isActive ? (direction === 'asc' ? ' ▲' : ' ▼') : null}
    </Button>
  );
}
