"use client"

import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import type { UseFormReturn } from "react-hook-form"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RelationshipFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  useSearch: (
    params: Record<string, string | number | string[]>, 
    options?: { 
      query?: { 
        enabled?: boolean; 
        staleTime?: number;
      } 
    }
  ) => { 
    data: { content?: SearchItem[]; } | SearchItem[]; 
    isLoading: boolean; 
  };
  displayField?: string;
  required?: boolean;
  helperText?: string;
  relationshipType?: 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many';
  disabled?: boolean;
}

interface SearchItem {
  id: string | number;
  [key: string]: any;
}

export function RelationshipField({
  form,
  name,
  label,
  useSearch,
  displayField = "name",
  required,
  helperText,
  relationshipType = 'many-to-one',
  disabled = false
}: RelationshipFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [selectedItems, setSelectedItems] = useState<SearchItem[]>([])
  
  const isMultiSelect = relationshipType === 'one-to-many' || relationshipType === 'many-to-many'

  // Build search params correctly for the API
  const searchParams = useMemo(() => {
    // Create search params to match API expectations
    const params: Record<string, string | number | string[]> = {
      query: debouncedSearch || '*', // Use * as wildcard when empty
      size: 20, // Reasonable limit
      page: 0,
      sort: ['id,asc']
    };
    
    // Add specific search field if search term provided
    if (debouncedSearch) {
      params[`${displayField}.contains`] = debouncedSearch;
    }
    
    return params;
  }, [debouncedSearch, displayField]);

  // Use the correct parameters for the search hook
  const { data: apiResponse, isLoading } = useSearch(
    searchParams, 
    { 
      query: { 
        enabled: open,
        staleTime: 10000
      } 
    }
  );

  // Handle both array and paginated responses and ensure type safety
  const items: SearchItem[] = useMemo(() => (
    Array.isArray(apiResponse) ? apiResponse : apiResponse?.content || []
  ), [apiResponse]);

  // Update form value when selectedItems changes in multi-select mode
  useEffect(() => {
    if (isMultiSelect && selectedItems.length > 0) {
      form.setValue(name, selectedItems, { shouldDirty: true, shouldValidate: true })
    }
  }, [selectedItems, isMultiSelect, form, name])

  // Initialize selectedItems from form value
  useEffect(() => {
    const currentValue = form.getValues(name)
    if (isMultiSelect && Array.isArray(currentValue)) {
      setSelectedItems(currentValue)
    }
  }, [form, name, isMultiSelect])

  // Handle selection/deselection in multi-select mode
  const toggleSelection = (item: SearchItem) => {
    if (isMultiSelect) {
      const isSelected = selectedItems.some(selected => selected.id === item.id)
      
      if (isSelected) {
        setSelectedItems(selectedItems.filter(selected => selected.id !== item.id))
      } else {
        setSelectedItems([...selectedItems, item])
      }
    } else {
      form.setValue(name, item, { shouldDirty: true, shouldValidate: true })
      setOpen(false)
    }
  }

  // Helper to format display text
  const formatDisplayText = (item: SearchItem | null) => {
    if (!item) return '';
    
    // Handle cases where the display field might be nested
    if (displayField.includes('.')) {
      const parts = displayField.split('.');
      let value = item;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return '';
      }
      return value;
    }
    
    return item[displayField];
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}{required && <span className="text-destructive ms-1">*</span>}</FormLabel>
          
          {isMultiSelect ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedItems.length > 0 ? selectedItems.map(item => (
                  <Badge 
                    key={item.id} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {formatDisplayText(item)}
                    <button 
                      type="button" 
                      className="ml-1 rounded-full outline-none focus:ring-2"
                      onClick={() => toggleSelection(item)}
                    >
                      ×
                    </button>
                  </Badge>
                )) : (
                  <div className="text-muted-foreground text-sm">No {label.toLowerCase()} selected</div>
                )}
              </div>
              
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      type="button"
                      disabled={disabled}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      Select {label}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={`Search ${label.toLowerCase()}...`}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      {isLoading && (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      )}
                      <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                      <CommandGroup>
                        {items?.map((item) => {
                          const isSelected = selectedItems.some(selected => selected.id === item.id);
                          return (
                            <CommandItem
                              key={item.id}
                              onSelect={() => toggleSelection(item)}
                              className="flex items-center"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {formatDisplayText(item)}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    type="button"
                    disabled={disabled}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? formatDisplayText(field.value)
                      : `Select ${label}`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={`Search ${label.toLowerCase()}...`}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    {isLoading && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    )}
                    <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup>
                      {items?.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => {
                            form.setValue(name, item, { shouldDirty: true, shouldValidate: true })
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.id === item.id 
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {formatDisplayText(item)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          
          {helperText && <FormDescription>{helperText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
