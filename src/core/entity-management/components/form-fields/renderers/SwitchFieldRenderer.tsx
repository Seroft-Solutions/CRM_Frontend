import React from 'react';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function SwitchFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className="flex flex-row items-center justify-between p-1">
          <div className="space-y-0.5">
            <FormLabel>{field.label}</FormLabel>
            {field.description && <FormDescription>{field.description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={formField.value}
              onCheckedChange={formField.onChange}
              disabled={isDisabled}
              aria-label={field.label}
              className={isDisabled ? 'opacity-50' : ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
