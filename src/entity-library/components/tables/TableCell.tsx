'use client';

import type { ColumnConfig } from '@/entity-library/config';

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toLocaleString();

  return JSON.stringify(value);
}

export function TableCell<TEntity extends object>({
  column,
  row,
}: {
  column: ColumnConfig<TEntity>;
  row: TEntity;
}) {
  const value = row[column.field];

  if (column.render) return <>{column.render(value, row)}</>;
  if (
    column.type === 'relationship' &&
    value &&
    typeof value === 'object' &&
    column.relationshipConfig
  ) {
    const display = (value as Record<string, unknown>)[column.relationshipConfig.displayField];

    return <span>{asText(display)}</span>;
  }
  if (column.type === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (column.type === 'date' || column.type === 'datetime') return <span>{asText(value)}</span>;

  return (
    <span className={column.truncate ? 'block max-w-[280px] truncate' : undefined}>
      {asText(value)}
    </span>
  );
}
