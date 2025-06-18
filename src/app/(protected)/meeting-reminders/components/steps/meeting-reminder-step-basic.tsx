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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface MeetingReminderStepBasicProps {
  form: UseFormReturn<any>;
}

export function MeetingReminderStepBasic({ form }: MeetingReminderStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <FormField
          control={form.control}
          name="reminderType"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Reminder Type *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter reminder type"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="failureReason"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Failure Reason</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter failure reason"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="reminderMinutesBefore"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Reminder Minutes Before *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter reminder minutes before"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
      </div>
    </div>
  );
}
