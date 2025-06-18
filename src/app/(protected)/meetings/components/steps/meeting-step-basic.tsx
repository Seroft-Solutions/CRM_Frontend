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


interface MeetingStepBasicProps {
  form: UseFormReturn<any>;
}

export function MeetingStepBasic({ form }: MeetingStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Title *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter title"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Description</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter description"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="meetingUrl"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Meeting Url</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter meeting url"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="googleCalendarEventId"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Google Calendar Event Id</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter google calendar event id"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Notes</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter notes"
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
        
        <FormField
          control={form.control}
          name="meetingStatus"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Meeting Status *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter meeting status"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="meetingType"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Meeting Type *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter meeting type"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Duration *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter duration"
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
