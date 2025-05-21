"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export interface ComboboxOption {
  label: string
  value: string | number
}

export interface ComboboxFieldProps {
  name: string
  label?: string
  description?: string
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  onSearch?: (value: string) => void
}

export function ComboboxField({
  name,
  label,
  description,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  loading,
  onSearch,
}: ComboboxFieldProps) {
  const [open, setOpen] = React.useState(false)
  const { control, formState: { errors } } = useFormContext()
  const error = errors[name]
  const value = control._formValues[name]

  const selectedOption = options.find(option => String(option.value) === value)

  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedOption?.label ?? placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput 
                placeholder={searchPlaceholder}
                onValueChange={onSearch}
                className="h-9"
              />
              <CommandEmpty>{loading ? "Loading..." : emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={String(option.value)}
                    onSelect={(currentValue) => {
                      control._formValues[name] = currentValue
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === String(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error?.message && <FormMessage>{error.message as string}</FormMessage>}
    </FormItem>
  )
}
