"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";


interface UserAvailabilityStepSettingsProps {
  form: UseFormReturn<any>;
}

export function UserAvailabilityStepSettings({ form }: UserAvailabilityStepSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium">Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <FormField
            control={form.control}
            name="isAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">Is Available</FormLabel>
                </div>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          
        </div>
      </div>

    </div>
  );
}
