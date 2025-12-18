'use client';

import * as React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { ColorPicker } from '@/components/ui/color-picker';

export interface ColorFieldControlProps {
  name: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ColorFieldControl({ name, disabled, placeholder }: ColorFieldControlProps) {
  const { control } = useFormContext();
  const {
    field: { value, onChange },
  } = useController({ name, control });

  return (
    <ColorPicker
      value={value as string | undefined}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
