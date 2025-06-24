'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { StepComponentProps } from '../form-types';
import { useEntityForm } from '../district-form-provider';

export function SettingsStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form } = useEntityForm();

  const fieldsForThisStep = config.fields.filter((field) => stepConfig.fields.includes(field.name));

  const booleanFields = fieldsForThisStep.filter((field) => field.type === 'boolean');
  const fileFields = fieldsForThisStep.filter((field) => field.type === 'file');
  const textareaFields = fieldsForThisStep.filter((field) => field.type === 'textarea');

  if (fieldsForThisStep.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No settings or file fields configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Boolean Fields */}
      {booleanFields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booleanFields.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">{fieldConfig.label}</FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={fieldConfig.ui?.disabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* File and Textarea Fields */}
      {(fileFields.length > 0 || textareaFields.length > 0) && (
        <div className="space-y-4">
          <h4 className="font-medium">Files & Additional Information</h4>
          <div className="grid grid-cols-1 gap-4">
            {textareaFields.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {fieldConfig.label}
                      {fieldConfig.required && ' *'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={fieldConfig.placeholder}
                        className={`min-h-[100px] ${config.ui.animations.fieldFocus} ${fieldConfig.ui?.className || ''}`}
                        rows={fieldConfig.ui?.rows || 4}
                        disabled={fieldConfig.ui?.disabled}
                        readOnly={fieldConfig.ui?.readonly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {fileFields.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {fieldConfig.label}
                      {fieldConfig.required && ' *'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept={fieldConfig.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                const base64 = event.target.result.toString().split(',')[1];
                                field.onChange(base64);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`${config.ui.animations.fieldFocus} ${fieldConfig.ui?.className || ''}`}
                        disabled={fieldConfig.ui?.disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
