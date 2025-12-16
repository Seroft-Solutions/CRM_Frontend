'use client';
import type { ColumnConfig } from '@/entity-library/config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
export function TableFiltersChips<TEntity extends object>({
  columns,
  filters,
  onChange,
}: {
  columns: Array<ColumnConfig<TEntity>>;
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const clearOne = (key: string) => {
    const next = { ...filters };
    delete next[key];
    onChange(next);
  };
  const active = columns
    .map((c) => {
      const k = String(c.field);
      return { key: k, label: String(c.header), value: (filters[k] ?? '').trim() };
    })
    .filter((x) => x.value);

  if (!active.length) return null;

  const visible = active.slice(0, 3), hiddenCount = active.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {visible.map((a) => (
        <Badge key={a.key} variant="secondary" className="gap-1">
          <span className="max-w-56 truncate">{a.label}: {a.value}</span>
          <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => clearOne(a.key)} aria-label={`Clear ${a.label} filter`}>
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge variant="secondary">+{hiddenCount} more</Badge> : null}
    </div>
  );
}
