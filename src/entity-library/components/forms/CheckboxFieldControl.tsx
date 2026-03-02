'use client';

import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxFieldControl({ name, disabled }: { name: string; disabled?: boolean }) {
  const { setValue, watch } = useFormContext<Record<string, unknown>>();
  const value = watch(name);

  return (
    <Checkbox
      checked={!!value}
      onCheckedChange={(v) => setValue(name, !!v, { shouldDirty: true, shouldValidate: true })}
      disabled={disabled}
    />
  );
}
