"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEntityForm } from "../call-form-provider";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";
import type { StepComponentProps } from "../form-types";

// Import the API hooks
import {
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import {
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses,
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

// Create hook mapping for dynamic resolution
const hookMapping = {
  'useGetAllUserProfiles': useGetAllUserProfiles,
  'useSearchUserProfiles': useSearchUserProfiles,
  'useCountUserProfiles': useCountUserProfiles,
  'useGetAllCallStatuses': useGetAllCallStatuses,
  'useSearchCallStatuses': useSearchCallStatuses,
  'useCountCallStatuses': useCountCallStatuses,
};

export function AssignmentDateStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form, actions } = useEntityForm();

  const fieldsForThisStep = config.fields.filter(field => 
    stepConfig.fields.includes(field.name)
  );

  const relationshipsForThisStep = config.relationships.filter(rel => 
    stepConfig.relationships.includes(rel.name) && rel.category === 'assignment'
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">📋 Assignment & Date</h3>
        <p className="text-muted-foreground">Assign user, set date and status</p>
      </div>
      
      <div className={`grid ${config.ui.responsive.mobile} ${config.ui.responsive.tablet} ${config.ui.responsive.desktop} ${config.ui.spacing.fieldGap}`}>
        {/* Date Fields */}
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
                            !validDate && "text-muted-foreground"
                          )}
                        >
                          {validDate ? (
                            format(validDate, "PPP")
                          ) : (
                            <span>{fieldConfig.placeholder}</span>
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
                          // Convert the selected date to a proper Date object
                          if (date) {
                            const adjustedDate = new Date(date);
                            // Set time to current time to preserve time component
                            const now = new Date();
                            adjustedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
                            field.onChange(adjustedDate);
                          } else {
                            field.onChange(null);
                          }
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

        {/* Relationship Fields */}
        {relationshipsForThisStep.map((relConfig) => (
          <FormField
            key={relConfig.name}
            control={form.control}
            name={relConfig.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {relConfig.ui.icon} {relConfig.ui.label}
                  {relConfig.required && " *"}
                </FormLabel>
                <FormControl>
                  <PaginatedRelationshipCombobox
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Handle entity creation callback
                      if (value && typeof value === 'number' && relConfig.creation?.canCreate) {
                        actions.handleEntityCreated(value, relConfig.name);
                      }
                    }}
                    displayField={relConfig.displayField}
                    placeholder={relConfig.ui.placeholder}
                    multiple={relConfig.multiple}
                    useGetAllHook={hookMapping[relConfig.api.useGetAllHook as keyof typeof hookMapping]}
                    useSearchHook={hookMapping[relConfig.api.useSearchHook as keyof typeof hookMapping]}
                    useCountHook={hookMapping[relConfig.api.useCountHook as keyof typeof hookMapping]}
                    entityName={relConfig.api.entityName}
                    canCreate={relConfig.creation?.canCreate}
                    createEntityPath={relConfig.creation?.createPath}
                    createPermission={relConfig.creation?.createPermission}
                    onEntityCreated={(entityId) => actions.handleEntityCreated(entityId, relConfig.name)}
                  />
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
