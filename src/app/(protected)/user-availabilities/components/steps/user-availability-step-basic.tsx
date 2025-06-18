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


interface UserAvailabilityStepBasicProps {
  form: UseFormReturn<any>;
}

export function UserAvailabilityStepBasic({ form }: UserAvailabilityStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Day Of Week *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter day of week"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Start Time *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter start time"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">End Time *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter end time"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Time Zone</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter time zone"
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
