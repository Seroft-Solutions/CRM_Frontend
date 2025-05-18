import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function CheckboxFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
          <FormControl>
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
              disabled={isDisabled}
              aria-label={field.label}
              className={isDisabled ? 'opacity-50' : ''}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{field.label}</FormLabel>
            {field.description && <FormDescription>{field.description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
