"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../meeting-reminder-form-provider";

export function BasicInfoStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form } = useEntityForm();

  const fieldsForThisStep = config.fields.filter(field => 
    stepConfig.fields.includes(field.name)
  );

  if (fieldsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No basic information fields configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`grid ${config.ui.responsive.mobile} ${config.ui.responsive.tablet} ${config.ui.responsive.desktop} ${config.ui.spacing.fieldGap}`}>
        {fieldsForThisStep.map((fieldConfig) => (
          <FormField
            key={fieldConfig.name}
            control={form.control}
            name={fieldConfig.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {fieldConfig.label}
                  {fieldConfig.required && " *"}
                </FormLabel>
                <FormControl>
                  {fieldConfig.type === 'enum' ? (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={fieldConfig.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldConfig.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      {...field}
                      type={fieldConfig.ui?.inputType || fieldConfig.type === 'number' ? 'number' : 'text'}
                      placeholder={fieldConfig.placeholder}
                      className={`${config.ui.animations.fieldFocus} ${fieldConfig.ui?.className || ''}`}
                      disabled={fieldConfig.ui?.disabled}
                      readOnly={fieldConfig.ui?.readonly}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
