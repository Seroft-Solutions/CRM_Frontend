'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ColumnConfig } from '@/entity-library/config';
import { TableFiltersChips } from './TableFiltersChips';
import { Filter } from 'lucide-react';
export function TableFiltersPanel<TEntity extends object>({
  columns,
  filters,
  onChange,
}: {
  columns: Array<ColumnConfig<TEntity>>;
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const activeCount = Object.values(filters).filter((v) => v?.trim()).length;

  return (
    <div className="border-b bg-gradient-to-r from-[oklch(0.45_0.06_243)]/10 to-[oklch(0.45_0.06_243)]/5 px-3 py-2.5">
      <Collapsible>
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-[oklch(0.45_0.06_243)]/10"
            >
              <Filter className="h-4 w-4 text-[oklch(0.45_0.06_243)]" />
              <span className="font-semibold text-[oklch(0.45_0.06_243)]">Filters</span>
              {activeCount ? (
                <Badge variant="secondary" className="bg-[#f5b81d] text-[#0f172a] font-semibold">
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          </CollapsibleTrigger>
          {activeCount ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hover:bg-[oklch(0.45_0.06_243)]/10 font-medium"
              onClick={() => onChange({})}
            >
              Clear
            </Button>
          ) : null}
        </div>
        <TableFiltersChips<TEntity> columns={columns} filters={filters} onChange={onChange} />
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
            {columns.map((col) => (
              <label key={String(col.field)} className="w-full">
                <span className="sr-only">{col.header}</span>
                <Input
                  className="h-8 w-full"
                  placeholder={String(col.header)}
                  value={filters[String(col.field)] ?? ''}
                  onChange={(e) => onChange({ ...filters, [String(col.field)]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
