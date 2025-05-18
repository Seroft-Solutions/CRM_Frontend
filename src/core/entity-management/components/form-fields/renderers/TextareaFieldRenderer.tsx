import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function TextareaFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            <Textarea
              {...formField}
              disabled={isDisabled}
              placeholder={field.placeholder}
              className={isDisabled ? 'bg-gray-50 dark:bg-gray-800 opacity-75 min-h-[100px]' : 'min-h-[100px]'}
              aria-label={field.label}
              rows={field.rows || 4}
            />
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
