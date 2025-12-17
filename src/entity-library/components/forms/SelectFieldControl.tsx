'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SelectFieldControl({
  name,
  disabled,
  placeholder,
  options,
}: {
  name: string;
  disabled?: boolean;
  placeholder?: string;
  options: Array<{ label: string; value: string | number | boolean }>;
}) {
  const { setValue, watch } = useFormContext<Record<string, unknown>>();
  const value = watch(name);

  const valueKey = useMemo(() => {
    if (value == null) return '';
    const match = options.find((o) => String(o.value) === String(value));

    return match ? String(match.value) : String(value);
  }, [options, value]);

  return (
    <Select
      value={valueKey}
      onValueChange={(v) => {
        const match = options.find((o) => String(o.value) === v);

        setValue(name, match ? match.value : v, { shouldDirty: true, shouldValidate: true });
      }}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
