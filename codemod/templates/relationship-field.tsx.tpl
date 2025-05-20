"use client"

import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
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
  form: any;
  name: string;
  label: string;
  useSearch: any; // This uses the generated hooks
  displayField?: string;
  required?: boolean;
  helperText?: string;
  relationshipType?: 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many';
  disabled?: boolean;
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
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  
  const isMultiSelect = relationshipType === 'one-to-many' || relationshipType === 'many-to-many'

  // Use the provided search hook with proper parameters
  const { data: items = [], isLoading } = useSearch({
    params: { query: search },
    query: { enabled: open }
  })

  // Update form value when selectedItems changes in multi-select mode
  useEffect(() => {
    if (isMultiSelect && selectedItems.length > 0) {
      form.setValue(name, selectedItems, { shouldDirty: true })
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
  const toggleSelection = (item: any) => {
    if (isMultiSelect) {
      const isSelected = selectedItems.some(selected => selected.id === item.id)
      
      if (isSelected) {
        setSelectedItems(selectedItems.filter(selected => selected.id !== item.id))
      } else {
        setSelectedItems([...selectedItems, item])
      }
    } else {
      form.setValue(name, item, { shouldDirty: true })
      setOpen(false)
    }
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
                    {item[displayField]}
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
                          const isSelected = selectedItems.some(selected => selected.id === item.id)
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
                              {item[displayField]}
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
                      ? items?.find((item) => item.id === field.value.id)?.[displayField] || field.value[displayField]
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
                            form.setValue(name, item, { shouldDirty: true })
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
                          {item[displayField]}
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