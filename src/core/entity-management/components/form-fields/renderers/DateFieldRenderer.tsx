import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldRendererProps } from '../index';
import { cn } from '@/lib/utils';

export function DateFieldRenderer({ field, form, formMode, data, isReadOnly }: FieldRendererProps) {
  const isDisabled = field.disabled || isReadOnly || formMode === 'view';
  
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{field.label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "pl-3 text-left font-normal",
                    !formField.value && "text-muted-foreground",
                    isDisabled && "bg-gray-50 dark:bg-gray-800 opacity-75"
                  )}
                  disabled={isDisabled}
                  aria-label={field.label}
                >
                  {formField.value ? (
                    format(new Date(formField.value), "PPP")
                  ) : (
                    <span>{field.placeholder || "Select a date"}</span>
                  )}
                  {/* Calendar icon using SVG directly instead of importing from radix-ui */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="ml-auto h-4 w-4 opacity-50"
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formField.value ? new Date(formField.value) : undefined}
                onSelect={formField.onChange}
                disabled={isDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
