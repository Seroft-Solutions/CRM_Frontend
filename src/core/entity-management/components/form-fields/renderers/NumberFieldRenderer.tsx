import React from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function NumberFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            <Input
              {...formField}
              disabled={isDisabled}
              placeholder={field.placeholder}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className={isDisabled ? 'bg-gray-50 dark:bg-gray-800 opacity-75' : ''}
              aria-label={field.label}
              onChange={(e) => {
                // Convert string value to number for number inputs
                const value = e.target.value === '' ? '' : Number(e.target.value);
                formField.onChange(value);
              }}
            />
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
