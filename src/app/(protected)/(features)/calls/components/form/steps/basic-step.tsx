// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RelationshipRenderer } from "../relationship-renderer";

// Utility function to transform enum values from UPPERCASE to Title Case
function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;
  
  return enumValue
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface CallBasicStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CallBasicStep({ form, config, actions, entity }: CallBasicStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Status Field */}
          <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-sm font-medium">
                          Status
                          <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                          <Select
                              value={
                                  field.value
                              }
                              onValueChange={(value) => {
                                  field.onChange(value);
                                  form.trigger('status');
                              }}
                          >
                              <SelectTrigger>
                                  <SelectValue
                                      placeholder={'Select status'}
                                  />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="DRAFT">Draft</SelectItem>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                              </SelectContent>
                          </Select>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
          />
        {/* Generated Relationship Fields */}
      </div>
    </div>
  );
}
