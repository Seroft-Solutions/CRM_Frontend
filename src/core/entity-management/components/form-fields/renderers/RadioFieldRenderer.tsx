import React, { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';

export function RadioFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
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
          <FormControl>
            <RadioGroup
              onValueChange={formField.onChange}
              defaultValue={formField.value}
              value={formField.value}
              disabled={isDisabled}
              className="flex flex-col space-y-2"
            >
              {options.map((option) => (
                <FormItem 
                  key={option.value} 
                  className="flex items-center space-x-3 space-y-0"
                >
                  <FormControl>
                    <RadioGroupItem
                      value={option.value.toString()}
                      className={isDisabled ? 'opacity-50' : ''}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
