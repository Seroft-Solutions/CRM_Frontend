"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label?: string
  description?: string
}

export function FormField({
  name,
  label,
  description,
  type = "text",
  ...props
}: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors[name]

  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Input
          type={type}
          {...register(name)}
          {...props}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error?.message && <FormMessage>{error.message as string}</FormMessage>}
    </FormItem>
  )
}
