'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ColorPicker({
  value = '#000000',
  onChange,
  disabled,
  placeholder,
}: ColorPickerProps) {
  const [hexValue, setHexValue] = React.useState(value);

  React.useEffect(() => {
    setHexValue(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setHexValue(newValue);
    onChange?.(newValue);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (!newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }
    setHexValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange?.(newValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          disabled={disabled}
          className={cn(
            'h-10 w-14 cursor-pointer rounded-md border border-input bg-background',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />
      </div>
      <Input
        type="text"
        value={hexValue}
        onChange={handleHexInputChange}
        disabled={disabled}
        placeholder={placeholder || '#000000'}
        className="flex-1"
        maxLength={7}
      />
    </div>
  );
}
