import React, { useEffect, useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function SelectFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  const [options, setOptions] = useState(field.options || []);
  
  // Handle dynamic options loading
  useEffect(() => {
    const loadOptions = async () => {
      if (field.loadOptions) {
        try {
          const loadedOptions = await field.loadOptions(data);
          setOptions(loadedOptions);
        } catch (error) {
          console.error('Error loading options:', error);
        }
      }
    };
    
    loadOptions();
  }, [field, data]);
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <Select
            disabled={isDisabled}
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            value={formField.value}
          >
            <FormControl>
              <SelectTrigger 
                className={isDisabled ? 'bg-gray-50 dark:bg-gray-800 opacity-75' : ''}
                aria-label={field.label}
              >
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
