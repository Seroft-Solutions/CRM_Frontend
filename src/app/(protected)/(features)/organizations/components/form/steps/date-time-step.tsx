"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../organization-form-provider";

export function DateTimeStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form } = useEntityForm();

  const fieldsForThisStep = config.fields.filter(field => 
    stepConfig.fields.includes(field.name) && field.type === 'date'
  );

  if (fieldsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No date/time fields configured.</p>
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
            render={({ field }) => {
              // Handle string to Date conversion for field value
              let fieldValue: Date | undefined = undefined;
              
              if (field.value instanceof Date) {
                fieldValue = field.value;
              } else if (field.value) {
                // Handle string values
                const parsed = new Date(field.value);
                if (!isNaN(parsed.getTime())) {
                  fieldValue = parsed;
                }
              }
              
              // Ensure the date is valid
              const validDate = fieldValue && !isNaN(fieldValue.getTime()) ? fieldValue : undefined;
              
              return (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">
                    {fieldConfig.label}
                    {fieldConfig.required && " *"}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !validDate && "text-muted-foreground",
                            config.ui.animations.fieldFocus,
                            fieldConfig.ui?.className
                          )}
                          disabled={fieldConfig.ui?.disabled}
                        >
                          {validDate ? (
                            format(validDate, "PPP")
                          ) : (
                            <span>{fieldConfig.placeholder || "Select date"}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validDate}
                        onSelect={(date) => {
                          // Always pass Date object to form
                          field.onChange(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
