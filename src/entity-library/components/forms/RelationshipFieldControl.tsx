'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { RelationshipFieldConfig } from '@/entity-library/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  return (
    <Select
      value={selectedKey}
      onValueChange={(v) => {
        const match = options.find((o) => o.key === v);

        if (!match) return;
        const nextValue = config.toValue ? config.toValue(match.raw) : match.raw;

        setValue(name, nextValue, { shouldDirty: true, shouldValidate: true });
      }}
      disabled={disabled || q.isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={config.placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
