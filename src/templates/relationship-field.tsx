'use client';

import { useEffect, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RelationshipFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  useSearch: any; // Function to search related entities
  displayField: string; // Field to display in the dropdown
  required?: boolean;
  relationshipType: 'many-to-one' | 'one-to-many' | 'many-to-many';
  helperText?: string;
  disabled?: boolean;
}

export default function RelationshipField({
  form,
  name,
  label,
  useSearch,
  displayField,
  required = false,
  relationshipType,
  helperText,
  disabled = false,
}: RelationshipFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use the search API with a debounced search term
  const { data, isLoading } = useSearch(
    { query: searchTerm },
    { query: { enabled: searchTerm.length > 0 || open } }
  );
  
  // Memoize options to avoid rerenders
  const options = useMemo(() => data || [], [data]);
  
  // Handle multiple selections for one-to-many and many-to-many relationships
  const isMultiple = relationshipType === 'one-to-many' || relationshipType === 'many-to-many';
  
  // Get current value from form
  const currentValue = form.watch(name);
  
  // Format selected items for display
  const formatSelected = (value: any) => {
    if (!value) return '';
    
    if (isMultiple) {
      if (!Array.isArray(value) || value.length === 0) return '';
      return `${value.length} selected`;
    }
    
    return value[displayField] || `ID: ${value.id}`;
  };
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}{required && <span className="text-destructive"> *</span>}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {isLoading ? (
                    <Skeleton className="h-4 w-[100px]" />
                  ) : (
                    formatSelected(field.value) || `Select ${label}`
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder={`Search ${label.toLowerCase()}...`} 
                  onValueChange={setSearchTerm}
                />
                {isLoading ? (
                  <div className="py-6 text-center text-sm">
                    <Skeleton className="h-4 w-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-full mx-auto" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((item: any) => {
                        const isSelected = isMultiple
                          ? Array.isArray(field.value) && field.value.some((val: any) => val.id === item.id)
                          : field.value?.id === item.id;
                        
                        return (
                          <CommandItem
                            key={item.id}
                            value={item.id.toString()}
                            onSelect={() => {
                              if (isMultiple) {
                                // For multiple selection, toggle the item
                                const currentItems = Array.isArray(field.value) ? [...field.value] : [];
                                const itemIndex = currentItems.findIndex((val: any) => val.id === item.id);
                                
                                if (itemIndex >= 0) {
                                  // Remove if already selected
                                  currentItems.splice(itemIndex, 1);
                                } else {
                                  // Add if not selected
                                  currentItems.push(item);
                                }
                                
                                field.onChange(currentItems);
                              } else {
                                // For single selection, replace the value
                                field.onChange(isSelected ? null : item);
                                setOpen(false);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item[displayField] || `ID: ${item.id}`}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Display selected items for multiple selection */}
          {isMultiple && Array.isArray(field.value) && field.value.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {field.value.map((item: any) => (
                <Badge key={item.id} variant="secondary">
                  {item[displayField] || `ID: ${item.id}`}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => {
                      const newItems = field.value.filter((val: any) => val.id !== item.id);
                      field.onChange(newItems);
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          
          {helperText && <FormDescription>{helperText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
