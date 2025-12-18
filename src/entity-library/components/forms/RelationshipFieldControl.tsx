'use client';

import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { RelationshipFieldConfig } from '@/entity-library/config';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function defaultGetValueId(value: unknown): string | number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>).id;

    if (typeof id === 'string' || typeof id === 'number') return id;
  }

  return undefined;
}

export function RelationshipFieldControl({
  name,
  disabled,
  config,
}: {
  name: string;
  disabled?: boolean;
  config: RelationshipFieldConfig;
}) {
  const { setValue, watch } = useFormContext<Record<string, unknown>>();
  const value = watch(name);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const queryParams = config.params ?? { page: 0, size: 1000 };
  const q = config.useGetAll(queryParams);

  const options = useMemo(() => {
    const data = q.data;
    const rows = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
        ? ((data as { content?: unknown[] }).content ?? [])
        : [];

    return rows.map((o) => ({
      key: String(config.getOptionId(o)),
      label: config.getOptionLabel(o),
      raw: o,
    }));
  }, [config, q.data]);

  const selectedKey = useMemo(() => {
    const id = (config.getValueId ?? defaultGetValueId)(value);

    return id == null ? '' : String(id);
  }, [config, value]);

  const selectedLabel = useMemo(
    () => options.find((o) => o.key === selectedKey)?.label ?? '',
    [options, selectedKey]
  );

  const handleSelect = (k: string) => {
    const match = options.find((o) => o.key === k);

    if (!match) return;

    const nextValue = config.toValue ? config.toValue(match.raw) : match.raw;

    setValue(name, nextValue, { shouldDirty: true, shouldValidate: true });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || q.isLoading}
        >
          {selectedLabel || config.placeholder || 'Select…'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((o) =>
                  search.trim() ? o.label.toLowerCase().includes(search.toLowerCase()) : true
                )
                .map((o) => (
                  <CommandItem key={o.key} value={o.key} onSelect={(v) => handleSelect(v)}>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        o.key === selectedKey ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {o.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
