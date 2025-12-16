'use client';

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

  return (
    <Select
      value={typeof value === 'string' ? value : value == null ? '' : String(value)}
      onValueChange={(v) => setValue(name, v, { shouldDirty: true })}
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
