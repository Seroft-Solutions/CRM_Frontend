"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectFieldProps {
  name: string
  label?: string
  description?: string
  options: SelectOption[]
  placeholder?: string
}

export function SelectField({
  name,
  label,
  description,
  options,
  placeholder = "Select an option...",
}: SelectFieldProps) {
  const { control, formState: { errors } } = useFormContext()
  const error = errors[name]

  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Select
          name={name}
          onValueChange={(value) => {
            control._formValues[name] = value
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error?.message && <FormMessage>{error.message as string}</FormMessage>}
    </FormItem>
  )
}
